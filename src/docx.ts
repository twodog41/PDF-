import { renderAsync } from 'docx-preview';

export async function renderDocx(file: File, container: HTMLElement): Promise<void> {
  container.replaceChildren();
  await renderAsync(file, container, undefined, {
    breakPages: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    hideWrapperOnPrint: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderChanges: false,
    renderComments: false,
    renderAltChunks: false,
    useBase64URL: true,
  });

  container.querySelectorAll<HTMLElement>('[src], [href]').forEach((element) => {
    const attribute = element.hasAttribute('src') ? 'src' : 'href';
    const value = element.getAttribute(attribute) ?? '';
    if (/^https?:/i.test(value)) element.removeAttribute(attribute);
  });
  container.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
    anchor.rel = 'noreferrer noopener';
    anchor.target = '_blank';
  });
}

export function printDocx() {
  window.print();
}
