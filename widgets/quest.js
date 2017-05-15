export const createQuest = (cmd, args) => {
  return {
    type: 'QUEST',
    cmd: cmd,
    args: args,
  };
};
