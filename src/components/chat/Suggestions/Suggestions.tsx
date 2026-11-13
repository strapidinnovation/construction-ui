import styles from './Suggestions.module.scss';

export type Prompt = { title: string; detail: string; text: string };

type Props = { prompts: Prompt[]; onPick: (text: string) => void; disabled?: boolean };

export function Suggestions({ prompts, onPick, disabled }: Props) {
  return (
    <div className={styles.suggestions}>
      {prompts.map((p) => (
        <button
          key={p.title}
          type="button"
          className={styles.suggestion}
          onClick={() => onPick(p.text)}
          disabled={disabled}
        >
          <strong>{p.title}</strong>
          <span>{p.detail}</span>
        </button>
      ))}
    </div>
  );
}
