import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import { CreateTodoInput, Todo } from '@forge-todo-app/todo-api';

const resolver = new Resolver();

const getUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);

const getListKeyFromContext = (context) => {
  console.log(context);
  const { localId: id } = context;
  return id.split('/')[id.split('/').length - 1];
};

const getAll = async (listId: string): Promise<Todo[]> => {
  return (await storage.get(listId)) || [];
};

resolver.define('get-all', ({ context }) => {
  return getAll(getListKeyFromContext(context));
});

resolver.define('create', async ({ payload, context }) => {
  const listId = getListKeyFromContext(context);
  const records = await getAll(listId);
  const id = getUniqueId();

  const newRecord: Todo = {
    id,
    ...(payload as CreateTodoInput),
  };

  await storage.set(getListKeyFromContext(context), [...records, newRecord]);

  return newRecord;
});

resolver.define('update', async ({ payload, context }) => {
  const listId = getListKeyFromContext(context);
  let records = await getAll(listId);

  records = records.map((item) => {
    if (item.id === payload.id) {
      return payload as Todo;
    }
    return item;
  });

  await storage.set(getListKeyFromContext(context), records);

  return payload;
});

resolver.define('delete', async ({ payload, context }) => {
  const listId = getListKeyFromContext(context);
  let records = await getAll(listId);

  records = records.filter((item) => item.id !== payload.id);

  await storage.set(getListKeyFromContext(context), records);

  return payload;
});

resolver.define('delete-all', ({ context }) => {
  return storage.set(getListKeyFromContext(context), []);
});

export const handler = resolver.getDefinitions();
