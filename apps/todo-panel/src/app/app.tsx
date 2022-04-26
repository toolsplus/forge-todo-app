import React, { useEffect, useState, Fragment, FormEvent } from 'react';
import { invoke } from '@forge/bridge';
import { Todo, CreateTodoInput, DeleteTodoInput } from '@forge-todo-app/todo-api';
import Button from '@atlaskit/button';
import LoadingButton from '@atlaskit/button/loading-button';
import { Checkbox } from '@atlaskit/checkbox';
import EditorCloseIcon from '@atlaskit/icon/glyph/editor/close';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import Textfield from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import {
  Card,
  Row,
  Icon,
  IconContainer,
  Status,
  SummaryActions,
  SummaryCount,
  SummaryFooter,
  ScrollContainer,
  Form,
  LoadingContainer,
} from './styles';

interface TodoView extends Omit<Todo, 'id'> {
  id?: string;
  isSaving?: boolean;
  isDeleting?: boolean;
}

function App() {
  const [todos, setTodos] = useState<null | TodoView[]>(null);
  const [input, setInput] = useState('');
  const [isFetched, setIsFetched] = useState(false);
  const [isDeleteAllShowing, setDeleteAllShowing] = useState(false);
  const [isDeletingAll, setDeletingAll] = useState(false);

  if (!isFetched) {
    setIsFetched(true);
    invoke<Todo[]>('get-all').then(setTodos);
  }

  const createTodo = async (label: string) => {
    const newTodoList = [
      ...(todos || []),
      { label, isChecked: false, isSaving: true },
    ];
    setTodos(newTodoList);
  };

  const toggleTodo = (id?: string) => {
    if (todos) {
      setTodos(
        todos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, isChecked: !todo.isChecked, isSaving: true };
          }
          return todo;
        })
      );
    }
  };

  const deleteTodo = (id?: string) => {
    if (todos) {
      setTodos(
        todos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, isDeleting: true };
          }
          return todo;
        })
      );
    }
  };

  const deleteAllTodos = async () => {
    setDeletingAll(true);

    await invoke('delete-all');

    setTodos([]);
    setDeleteAllShowing(false);
    setDeletingAll(false);
  };

  const onSubmit = (e: FormEvent<unknown>) => {
    e.preventDefault();
    createTodo(input);
    setInput('');
  };

  useEffect(() => {
    if (!todos) return;
    if (!todos.find((todo) => todo.isSaving || todo.isDeleting)) return;

    Promise.all(
      todos.map((todo) => {
        if (todo.isSaving && !todo.id) {
          const createInput: CreateTodoInput = {
            label: todo.label,
            isChecked: false,
          };
          return invoke<Todo>('create', createInput);
        }
        if (todo.isSaving && todo.id) {
          const updateInput: Todo = {
            id: todo.id,
            label: todo.label,
            isChecked: todo.isChecked,
          };
          return invoke<Todo>('update', updateInput);
        }
        if (todo.isDeleting && todo.id) {
          const deleteInput: DeleteTodoInput = { id: todo.id };
          return invoke<void>('delete', deleteInput).then(() => false);
        }
        return todo;
      })
    )
      .then((saved) => saved.filter((a) => a) as Todo[])
      .then(setTodos);
  }, [todos]);

  if (!todos) {
    return (
      <Card>
        <LoadingContainer>
          <Spinner size="large" />
        </LoadingContainer>
      </Card>
    );
  }

  const completedCount = todos.filter((todo) => todo.isChecked).length;
  const totalCount = todos.length;

  const Rows = () => (
    <Fragment>
      {todos.map(({ id, label, isChecked, isSaving, isDeleting }, i) => {
        const isSpinnerShowing = isSaving || isDeleting;

        return (
          <Row isChecked={isChecked} key={label}>
            <Checkbox
              isChecked={isChecked}
              label={label}
              name={label}
              onChange={() => toggleTodo(id)}
            />
            <Status>
              {isSpinnerShowing ? <Spinner size="medium" /> : null}
              {isChecked ? <Lozenge appearance="success">Done</Lozenge> : null}
              <Button spacing="none" onClick={() => deleteTodo(id)}>
                <IconContainer>
                  <Icon>
                    <EditorCloseIcon label={'Close'} />
                  </Icon>
                </IconContainer>
              </Button>
            </Status>
          </Row>
        );
      })}
    </Fragment>
  );

  const DeleteAll = () =>
    isDeleteAllShowing ? (
      <LoadingButton
        appearance="danger"
        spacing="compact"
        isLoading={isDeletingAll}
        isDisabled={isDeletingAll}
        onClick={deleteAllTodos}
      >
        Delete All
      </LoadingButton>
    ) : (
      <LoadingButton
        appearance="subtle"
        spacing="none"
        onClick={() => setDeleteAllShowing(true)}
      >
        <IconContainer>
          <Icon>
            <TrashIcon label={'Delete'} />
          </Icon>
        </IconContainer>
      </LoadingButton>
    );

  const CompletedLozenge = () => (
    <Lozenge>
      {completedCount}/{totalCount} Completed
    </Lozenge>
  );

  return (
    <Card>
      <ScrollContainer>
        <Rows />
        <Row isCompact>
          <Form onSubmit={onSubmit}>
            <Textfield
              appearance="subtle"
              placeholder="Add a todo +"
              value={input}
              onChange={({ currentTarget }) => setInput(currentTarget.value)}
            />
          </Form>
        </Row>
      </ScrollContainer>
      <SummaryFooter>
        <SummaryCount>
          <CompletedLozenge />
        </SummaryCount>
        <SummaryActions>
          <DeleteAll />
        </SummaryActions>
      </SummaryFooter>
    </Card>
  );
}

export default App;
