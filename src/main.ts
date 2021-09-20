import * as core from '@actions/core'
import {install} from './installer'
import {dockerPullImage} from './utils'

export const run = async (): Promise<void> => {
  try {
    // can include version e.g. amazon/aws-cli or amazon/aws-cli:2
    const dockerImage = core.getInput('dockerimage')
    const aliasCommand = core.getInput('alias')

    await install(dockerImage, aliasCommand)
    await dockerPullImage(dockerImage)
  } catch (error) {
    core.setFailed(error.message)
  }
}
