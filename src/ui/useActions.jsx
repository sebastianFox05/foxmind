/*
 * Atajos para abrir cada formulario en un modal desde cualquier vista, la paleta o el boton +.
 */
import { useMemo } from 'react';
import { useUi } from './UiContext.jsx';
import TaskForm from '../components/forms/TaskForm.jsx';
import RunForm from '../components/forms/RunForm.jsx';
import WorkoutForm from '../components/forms/WorkoutForm.jsx';
import ReadingForm from '../components/forms/ReadingForm.jsx';
import BookForm from '../components/forms/BookForm.jsx';
import ChallengeForm from '../components/forms/ChallengeForm.jsx';
import HabitForm from '../components/forms/HabitForm.jsx';
import RoutineForm from '../components/forms/RoutineForm.jsx';
import NoteForm from '../components/forms/NoteForm.jsx';
import JournalForm from '../components/forms/JournalForm.jsx';
import BoardForm from '../components/forms/BoardForm.jsx';
import RecordForm from '../components/forms/RecordForm.jsx';
import MealForm from '../components/forms/MealForm.jsx';

export function useActions() {
  const { openModal } = useUi();
  return useMemo(() => ({
    openTask: (task, preset) => openModal({ title: task?.id ? 'Editar tarea' : 'Nueva tarea', render: (close) => <TaskForm task={task?.id ? task : { ...preset, ...task }} onDone={close} /> }),
    openRun: (run, preset) => openModal({ title: run?.id ? 'Editar carrera' : 'Registrar carrera', render: (close) => <RunForm run={run?.id ? run : { ...preset }} onDone={close} /> }),
    openWorkout: (workout, preset) => openModal({ title: workout?.id ? 'Editar sesión' : 'Registrar sesión de gym', size: 'large', render: (close) => <WorkoutForm workout={workout || {}} preset={preset || {}} onDone={close} /> }),
    openReading: (preset) => openModal({ title: 'Registrar lectura', render: (close) => <ReadingForm preset={preset || {}} onDone={close} /> }),
    openBook: (book) => openModal({ title: book?.id ? 'Editar libro' : 'Nuevo libro', render: (close) => <BookForm book={book || {}} onDone={close} /> }),
    openChallenge: (challenge, preset) => openModal({ title: challenge?.id ? 'Editar reto' : 'Nuevo reto', render: (close) => <ChallengeForm challenge={challenge || {}} preset={preset || {}} onDone={close} /> }),
    openHabit: (habit) => openModal({ title: habit?.id ? 'Editar actividad' : 'Nueva actividad diaria', render: (close) => <HabitForm habit={habit || {}} onDone={close} /> }),
    openRoutine: (routine, kind) => openModal({ title: routine?.id ? 'Editar rutina' : 'Nueva rutina', size: 'large', render: (close) => <RoutineForm routine={routine || {}} kind={kind} onDone={close} /> }),
    openNote: (note, kind) => openModal({ title: note?.id ? 'Editar nota' : 'Nueva nota', render: (close) => <NoteForm note={note || {}} kind={kind} onDone={close} /> }),
    openJournal: (date) => openModal({ title: 'Diario', render: (close) => <JournalForm date={date} onDone={close} /> }),
    openBoard: () => openModal({ title: 'Cargar el tablero', render: (close) => <BoardForm onDone={close} /> }),
    openMeal: (meal, preset) => openModal({ title: meal?.id ? 'Editar comida' : 'Registrar comida', render: (close) => <MealForm meal={meal || {}} preset={preset || {}} onDone={close} /> }),
    openRecord: (record) => openModal({ title: record?.id ? 'Editar marca' : 'Nueva marca', render: (close) => <RecordForm record={record || {}} onDone={close} /> })
  }), [openModal]);
}
