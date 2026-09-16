import './popup.css';
import type { ToolId } from './types';

document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => {
  button.addEventListener('click', () => {
    const tool = button.dataset.tool as ToolId;
    const runtime = (globalThis as { chrome?: { runtime?: { getURL(path: string): string }; tabs?: { create(input: { url: string }): void } } }).chrome;
    const url = runtime?.runtime?.getURL(`app.html?tool=${tool}`) ?? new URL(`app.html?tool=${tool}`, location.href).href;
    if (runtime?.tabs) runtime.tabs.create({ url });
    else window.open(url, '_blank', 'noopener');
    window.close();
  });
});
