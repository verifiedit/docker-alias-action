import {checkIfEnvironmentVariableIsOmitted, TEMP_DIRECTORY} from './utils'
import * as io from '@actions/io'
import path from 'path'
import {exec} from 'child_process'

const CONTAINER_WORKSPACE = '/github/workspace'
const CONTAINER_TEMP_DIRECTORY = '/_temp'

export const install = async (
  dockerImage: string,
  as: string
): Promise<void> => {
  const dockerCommand = await createDockerCommand(dockerImage)

  await setAlias(as, dockerCommand)
}

const setAlias = async (as: string, command: string): Promise<void> => {
  const cmd = `alias ${as}='${command}'`
  const {stdout} = await executeCommand(cmd)
  console.log(cmd)
  for (const line of stdout.split('\n')) {
    console.log(line)
  }
}

const createDockerCommand = async (dockerImage: string): Promise<string> => {
  const dockerTool: string = await io.which('docker', true)

  let environmentVariables = ''
  for (const key in process.env) {
    if (!checkIfEnvironmentVariableIsOmitted(key) && process.env[key]) {
      environmentVariables += ` -e "${key}=${process.env[key]}" `
    }
  }
  const github_env_file_relative_path = path.relative(
    TEMP_DIRECTORY,
    process.env.GITHUB_ENV || ''
  )
  const CONTAINER_GITHUB_ENV = path.resolve(
    CONTAINER_TEMP_DIRECTORY,
    github_env_file_relative_path
  )

  let command = `${dockerTool} run --rm -ti --workdir ${CONTAINER_WORKSPACE} `
  command += ` -v ${process.env.GITHUB_WORKSPACE}:${CONTAINER_WORKSPACE} `
  command += ` -v ${TEMP_DIRECTORY}:${CONTAINER_TEMP_DIRECTORY} `
  command += ` ${environmentVariables} `
  command += ` -e GITHUB_WORKSPACE=${CONTAINER_WORKSPACE} `
  command += ` -e GITHUB_ENV=${CONTAINER_GITHUB_ENV} `
  command += ` ${dockerImage}`

  return command
}

const executeCommand = async (
  command: string
): Promise<{stdout: string; stderr: string}> => {
  return new Promise(function (resolve, reject) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve({stdout, stderr})
      }
    })
  })
}
