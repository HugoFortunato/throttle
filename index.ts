import debug from 'debug';

const logger = debug('core');

const delays = [...Array(50)].map(() => Math.floor(Math.random() * 900) + 100);
const load = delays.map(
    (delay) => (): Promise<number> =>
        new Promise((resolve) => {
            setTimeout(() => resolve(Math.floor(delay / 100)), delay);
        }),
);

type Task = () => Promise<number>;

const throttle = async (workers: number, tasks: Task[]) => {
    const results: number[] = new Array(tasks.length);
    const executing: Promise<void>[] = [];
    let index = 0;

    const executeTask = async (taskIndex: number) => {
        const task = tasks[taskIndex];
        const result = await task();
        results[taskIndex] = result;
    };

    const runWorker = async () => {
        while (index < tasks.length) {
            if (executing.length < workers) {
                const taskIndex = index++;
                const taskExecution = executeTask(taskIndex);
                const taskPromise = taskExecution.then(() => {
                    executing.splice(executing.indexOf(taskPromise), 1);
                });
                executing.push(taskPromise);
            } else {
                await Promise.race(executing);
            }
        }
        await Promise.all(executing);
    };

    await Promise.all([...Array(workers)].map(runWorker));

    return results;
};
const bootstrap = async () => {
    logger('Starting...');
    const start = Date.now();
    const answers = await throttle(5, load);
    logger('Done in %dms', Date.now() - start);
    logger('Answers: %O', answers);
};
bootstrap().catch((err) => {
    logger('General fail: %O', err);
});
