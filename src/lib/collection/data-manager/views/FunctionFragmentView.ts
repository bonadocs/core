import {
  AbiCoder,
  BytesLike,
  concat,
  FunctionFragment,
  ParamType,
  Result,
} from 'ethers'

import { ContractParam, FragmentDisplayData } from '../../types'

import { ValueManagerView } from './ValueManagerView'

export class FunctionFragmentView {
  readonly #valueManagerView: ValueManagerView
  readonly #fragmentKey: string
  readonly #fragment: FunctionFragment
  readonly #displayData: FragmentDisplayData

  // this works because the instance is the same
  private readonly paths: Map<ParamType, string>

  private constructor(
    valueManagerView: ValueManagerView,
    fragmentKey: string,
    fragment: FunctionFragment,
  ) {
    this.#valueManagerView = valueManagerView
    this.#fragmentKey = fragmentKey
    this.#fragment = fragment
    this.paths = new Map()
    this.#displayData = []
  }

  /**
   * Creates a new FunctionFragmentView for the given function fragment.
   * @param valueManagerView
   * @param fragmentKey
   * @param fragment
   */
  static async create(
    valueManagerView: ValueManagerView,
    fragmentKey: string,
    fragment: FunctionFragment,
  ) {
    const view = new FunctionFragmentView(
      valueManagerView,
      fragmentKey,
      fragment,
    )
    await view.generateInputDisplayData()
    return view
  }

  /**
   * Returns the flat array structure that can be used to render the
   * inputs of the function fragment. It handles nested structures and
   * arrays and enables you to focus on the rendering logic.
   */
  get displayData(): FragmentDisplayData {
    return this.#displayData
  }

  /**
   * @returns The FunctionFragment for the backing function for this view
   */
  get fragment(): FunctionFragment {
    return this.#fragment
  }

  getDocText(path?: string) {
    const fullKey = `docs::${this.#fragmentKeyWithPath(path)}`
    return this.#valueManagerView.getString(fullKey)
  }

  getDataValue(path?: string) {
    const fullKey = `values::${this.#fragmentKeyWithPath(path)}`
    return this.#valueManagerView.getString(fullKey)
  }

  async setDocText(text: string, path?: string) {
    const fullKey = `docs::${this.#fragmentKeyWithPath(path)}`
    await this.#valueManagerView.setString(fullKey, text)
  }

  async setDataValue(value: string, path?: string) {
    const fullKey = `values::${this.#fragmentKeyWithPath(path)}`
    await this.#valueManagerView.setString(fullKey, value)
  }

  async deleteDocText(path?: string) {
    const fullKey = `docs::${this.#fragmentKeyWithPath(path)}`
    await this.#valueManagerView.deleteString(fullKey)
  }

  async deleteDataValue(path?: string) {
    const fullKey = `values::${this.#fragmentKeyWithPath(path)}`
    await this.#valueManagerView.deleteString(fullKey)
  }

  /**
   * Encodes the inputs of the function fragment into a call data string.
   * This can be used to call the function on the contract.
   */
  encodeFunctionData(): string {
    return concat([
      this.fragment.selector,
      AbiCoder.defaultAbiCoder().encode(
        this.#fragment.inputs,
        this.computeContractArguments() as unknown[],
      ),
    ])
  }

  decodeResult(data: BytesLike): Result {
    return AbiCoder.defaultAbiCoder().decode(this.#fragment.outputs, data)
  }

  /**
   * Adds an element to the dynamic array at the given index in the display data.
   * @param arrayDefinitionIndex The index of the array definition in the display data
   */
  async addArrayItem(arrayDefinitionIndex: number) {
    await this.modifyArrayElements(arrayDefinitionIndex)
  }

  /**
   * Deletes an element from the dynamic array at the given index in the display data.
   * The item to delete is selected by the indexToDelete parameter.
   *
   * @param arrayDefinitionIndex The index of the array definition in the display data
   * @param indexToDelete The index of the item to delete in the dynamic array
   */
  async deleteArrayItem(arrayDefinitionIndex: number, indexToDelete: number) {
    const arrayDefinition = this.#displayData[arrayDefinitionIndex]
    if (!arrayDefinition) {
      throw new Error('Invalid selection for add element')
    }

    if (arrayDefinition.baseType !== 'array' || arrayDefinition.length !== -1) {
      throw new Error('Selected element is not a dynamic array')
    }

    const arrayInputParam = this.getInputParamAtPath(arrayDefinition.path)
    if (!arrayInputParam) {
      throw new Error('Invalid array selection')
    }

    const generatedCount = Number(this.getDataValue(arrayDefinition.path))
    for (let i = indexToDelete; i < generatedCount; i++) {
      if (i === generatedCount - 1) {
        await this.deleteValuesForPath(arrayDefinition.path + '.' + i)
        await this.deleteValuesForPath(arrayDefinition.path + '.' + i)
      } else {
        await this.replaceValuesForPath(
          arrayDefinition.path + '.' + (i + 1),
          arrayDefinition.path + '.' + i,
          false,
        )
        await this.replaceValuesForPath(
          arrayDefinition.path + '.' + (i + 1),
          arrayDefinition.path + '.' + i,
          false,
        )
      }
    }
    await this.modifyArrayElements(arrayDefinitionIndex, -1)
  }

  /**
   * Generate the display data for the inputs of this function fragment.
   * The display data is a flat array structure that can be used to render
   * the inputs of the function fragment. It handles nested structures and
   * arrays and enables you to focus on the rendering logic.
   */
  private async generateInputDisplayData() {
    for (let i = 0; i < this.#fragment.inputs.length; i++) {
      const input = this.#fragment.inputs[i]
      await this.transformParamTypeToDisplayData(
        input,
        this.#displayData,
        0,
        input.name || String(i),
        true,
      )
    }
  }

  /**
   * Computes the contract arguments for this function fragment. It uses the
   * values set for the inputs to compute the arguments. If a value is not set
   * for an input, it throws an error.
   * @private
   */
  private computeContractArguments(): ContractParam {
    const params: ContractParam = []
    this.#fragment.inputs.forEach((inputType) => {
      params.push(this.computeArgument(inputType))
    })
    return params
  }

  private computeArgument(inputType: ParamType): ContractParam {
    if (inputType.components) {
      const params: ContractParam = []
      inputType.components.forEach((componentType) => {
        params.push(this.computeArgument(componentType))
      })
      return params
    }

    const path = this.paths.get(inputType)!
    if (inputType.arrayChildren) {
      const generatedCount = Number(this.getDataValue(path))
      const params: ContractParam = []
      for (let i = 0; i < generatedCount; i++) {
        params.push(this.computeArgument(inputType.arrayChildren))
      }
      return params
    }

    const value = this.getDataValue(path)
    if (value == null) {
      throw new Error(`Value not set for ${path}`)
    }

    return value
  }

  /**
   * Transforms the param type into a flat array structure that can be used to render
   * the inputs of the function fragment. It handles nested structures and
   * arrays and enables you to focus on the rendering logic.
   * @param paramType
   * @param values
   * @param indent
   * @param path
   * @param nameOverride
   * @param extraParams
   * @private
   */
  private async transformParamTypeToDisplayData(
    paramType: ParamType,
    values: FragmentDisplayData,
    indent = 0,
    path = '',
    nameOverride = false,
    extraParams = {},
  ) {
    const paramPath = nameOverride
      ? path
      : !path
        ? paramType.name
        : `${path}.${paramType.name}`

    if (paramType.components) {
      values.push({
        indent,
        index: values.length,
        name: paramType.name,
        baseType: paramType.baseType,
        path: paramPath,
        ...extraParams,
      })

      for (let i = 0; i < paramType.components.length; i++) {
        const componentType = paramType.components[i]
        await this.transformParamTypeToDisplayData(
          componentType,
          values,
          indent + 1,
          `${paramPath}.${i}`,
        )
      }
      return
    }

    if (paramType.arrayChildren) {
      let generatedCount = Number(this.getDataValue(paramPath))
      if (isNaN(generatedCount) || generatedCount < 1) {
        generatedCount = 1
      }
      generatedCount =
        paramType.arrayLength === -1 ? generatedCount : paramType.arrayLength!
      await this.setDataValue(generatedCount.toString(), paramPath)

      // revert back for dynamic array
      const arrayIndex = values.length
      values.push({
        indent,
        index: arrayIndex,
        name: paramType.name,
        baseType: paramType.baseType,
        length: paramType.arrayLength!,
        path: paramPath,
        ...extraParams,
      })

      for (let i = 0; i < generatedCount; i++) {
        await this.transformParamTypeToDisplayData(
          paramType.arrayChildren,
          values,
          indent + 1,
          `${paramPath}.${i}`,
          true,
          {
            arrayPath: paramPath,
            arrayIndex,
            indexInArray: i,
          },
        )
      }
      return
    }

    this.paths.set(paramType, paramPath)
    values.push({
      indent,
      index: values.length,
      name: paramType.name,
      baseType: paramType.baseType,
      path: paramPath,
      ...extraParams,
    })
  }

  /**
   * Deletes the values for the given path and all the sub-paths of the path.
   * @param path
   * @private
   */
  private async deleteValuesForPath(path: string) {
    // delete the value for the specific path
    await this.deleteDataValue(path)

    // delete values for all the sub-paths of the path
    const keys = this.paths.values()
    for (const key of keys) {
      if (key.startsWith(path + '.')) {
        await this.deleteDataValue(path)
      }
    }
  }

  /**
   * Replaces the values for the given path and all the sub-paths of the path. If the
   * deleteReplaced parameter is true, it deletes the replaced values.
   *
   * @param path
   * @param newPath
   * @param deleteReplaced
   * @private
   */
  private async replaceValuesForPath(
    path: string,
    newPath: string,
    deleteReplaced: boolean,
  ) {
    // replace the value for the specific path
    await this.setDataValue(this.getDataValue(path), newPath)
    if (deleteReplaced) {
      await this.deleteDataValue(path)
    }

    // replace values for all the sub-paths of the path
    const keys = this.paths.values()
    for (const key of keys) {
      if (key.startsWith(path) + '.') {
        const newKey = key.replace(path, newPath)
        await this.setDataValue(this.getDataValue(key), newKey)
        if (deleteReplaced) {
          await this.deleteDataValue(key)
        }
      }
    }
  }

  /**
   * Returns the input param at the given sub-path.
   *
   * @param subPath
   * @private
   */
  private getInputParamAtPath(subPath: string): ParamType | null {
    if (!subPath) {
      throw new Error('subPath is required for getInputParam')
    }

    const pathParts = subPath.split('.')
    let current: ParamType | null = null
    for (const part of pathParts) {
      if (!current) {
        current = this.#fragment.inputs.find((i) => i.name === part) || null
      } else if (current.arrayChildren) {
        current = current.arrayChildren
      } else if (current.components) {
        current = !isNaN(Number(part))
          ? current.components[Number(part)]
          : current.components.find((c) => c.name === part) || null
      }

      if (!current) {
        break
      }
    }

    return current
  }

  /**
   * Modifies the array elements at the given index in the display data. It adds the
   * given count of elements to the array. If the count is negative, it deletes the
   * elements from the end of the array.
   *
   * @param arrayDefinitionIndex
   * @param countToAdd
   * @private
   */
  private async modifyArrayElements(
    arrayDefinitionIndex: number,
    countToAdd = 1,
  ) {
    const arrayDefinition = this.#displayData[arrayDefinitionIndex]
    if (!arrayDefinition) {
      throw new Error('Invalid selection for add element')
    }

    if (arrayDefinition.baseType !== 'array' || arrayDefinition.length !== -1) {
      throw new Error('Selected element is not a dynamic array')
    }

    const elementDisplaySegments: FragmentDisplayData = []
    const arrayInputParam = this.getInputParamAtPath(arrayDefinition.path)
    if (!arrayInputParam) {
      throw new Error('Invalid array selection')
    }

    const prevGeneratedCount = Number(this.getDataValue(arrayDefinition.path))
    let generatedCount = countToAdd + prevGeneratedCount

    if (isNaN(generatedCount) || generatedCount < 1) {
      generatedCount = 1
    }
    await this.setDataValue(generatedCount.toString(), arrayDefinition.path)

    await this.transformParamTypeToDisplayData(
      arrayInputParam,
      elementDisplaySegments,
      arrayDefinition.indent,
      arrayDefinition.path.substring(0, arrayDefinition.path.lastIndexOf('.')),
    )
    const elementsPerItem = (elementDisplaySegments.length - 1) / generatedCount
    for (let i = 0; i < elementDisplaySegments.length; i++) {
      elementDisplaySegments[i].index += arrayDefinitionIndex
      elementDisplaySegments[i].arrayIndex = arrayDefinitionIndex
    }
    this.#displayData.splice(
      arrayDefinitionIndex,
      1 + elementsPerItem * prevGeneratedCount,
      ...elementDisplaySegments,
    )
  }

  #fragmentKeyWithPath(path?: string) {
    return path ? `${this.#fragmentKey}::${path}` : this.#fragmentKey
  }
}
