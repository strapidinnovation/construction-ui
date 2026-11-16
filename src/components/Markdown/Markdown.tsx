import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import { Link } from 'react-router';
import remarkGfm from 'remark-gfm';
import { apiUrl } from '../../api/client.ts';
import styles from './Markdown.module.scss';

/** Links to the app's own pages ("/projects/<id>") open in the app, not as API files. */
const isAppPage = (url: string) => url.startsWith('/projects/');

const components: Components = {
  a: ({ href, children }) =>
    href && isAppPage(href) ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
};

const urlTransform = (url: string) => defaultUrlTransform(isAppPage(url) ? url : apiUrl(url));

export function Markdown({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={urlTransform}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
