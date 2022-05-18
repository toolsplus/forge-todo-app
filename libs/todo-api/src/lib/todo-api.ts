export interface CreateTodoInput {
  label: string;
  isChecked: boolean;
}

export interface DeleteTodoInput {
  id: string;
}

export interface Todo {
  id: string;
  label: string;
  isChecked: boolean;
}

export const logger = (message: string) => {
  console.log(`[TODO]: ${message}`);
}
