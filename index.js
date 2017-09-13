import Logger from './src/log/logger';
import TransformTask from './src/transform/task';

function transformTask() {
  return new TransformTask();
}

export {
  Logger,
  TransformTask,
  transformTask
};
