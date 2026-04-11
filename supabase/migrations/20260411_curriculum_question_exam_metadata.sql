alter table public.curriculum_questions
  add column if not exists exam_metadata jsonb not null default '{}'::jsonb,
  add column if not exists reviewed boolean not null default false,
  add column if not exists active boolean not null default true;

alter table public.curriculum_questions
  drop constraint if exists curriculum_questions_exam_metadata_object,
  add constraint curriculum_questions_exam_metadata_object
    check (jsonb_typeof(exam_metadata) = 'object');

alter table public.curriculum_questions
  drop constraint if exists curriculum_questions_exam_metadata_paper,
  add constraint curriculum_questions_exam_metadata_paper
    check (
      not (exam_metadata ? 'paper')
      or exam_metadata ->> 'paper' in ('paper_1', 'paper_2')
    );

alter table public.curriculum_questions
  drop constraint if exists curriculum_questions_exam_metadata_command_word,
  add constraint curriculum_questions_exam_metadata_command_word
    check (
      not (exam_metadata ? 'commandWord')
      or exam_metadata ->> 'commandWord' in (
        'give',
        'state',
        'name',
        'identify',
        'write',
        'describe',
        'explain',
        'explain with additional justification',
        'discuss',
        'evaluate',
        'draw',
        'complete'
      )
    );
