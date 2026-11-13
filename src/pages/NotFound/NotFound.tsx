import { Compass } from 'lucide-react';
import { ButtonLink } from '../../components/Button/Button.tsx';
import { PageContainer } from '../../components/Page/Page.tsx';
import { EmptyState } from '../../components/States/States.tsx';
import styles from './NotFound.module.scss';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState icon={<Compass size={20} />} title="Page not found">
        That page doesn't exist.
      </EmptyState>
      <div className={styles.actions}>
        <ButtonLink to="/" variant="primary">
          Back to home
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
