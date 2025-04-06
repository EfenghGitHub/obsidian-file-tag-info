import { ItemView, WorkspaceLeaf, Notice, MarkdownView, FileView, Editor, MarkdownPreviewRenderer } from "obsidian";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "Example view";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const button = container.createEl('button', { text: '获取标签' });
    const listContainer = container.createEl('div');

    button.addEventListener('click', async () => {
      listContainer.empty();

      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        listContainer.createEl('p', { text: '没有文件' });
        return;
      }
      const leavesWithFile = this.app.workspace.getLeavesOfType("markdown").filter(leaf => (leaf.view as MarkdownView).file === activeFile);
      if (leavesWithFile.length == 0) {
        listContainer.createEl('p', { text: '没有打开?' });
        return;
      }

      const targetLeaf = leavesWithFile[0];

      const fileCache = this.app.metadataCache.getFileCache(activeFile);
      let fileContent = await this.app.vault.read(activeFile);
      const lines = fileContent.split("\n");

      const tags = fileCache.tags?.map(a => a.tag);
      const tagsRemoveHash = tags?.map(tag => tag.replace(/^#/, '')) || [];  // 可能是undefined, 这样就不用判断 if (tagsRemoveHash == undefined)
      const frontTags = fileCache.frontmatter?.tags || [];
      //const combinedTags = tags.concat(frontTags);
      const combinedTags = [...tagsRemoveHash, ...frontTags]; 
      const tagArray = [];
      if (combinedTags) {
        const tagSet = new Set(combinedTags);
        for (let tag of tagSet) {
          tagArray.push([tag, combinedTags?.filter((b) => (b === tag))?.length]);
        }
      } 

      const view = targetLeaf.view as MarkdownView;
      const editor = view.editor;
      if (!editor) {
        listContainer.createEl('p', { text: '没有文件对应的编辑器' });
        return;
      }

      let preview = false;

      if (view.getMode() === "source") {
        preview = false;
      } else {
        preview = true;
        listContainer.createEl('p', { text: '不支持预览模式' });
        return;
      }
      
      if (tagArray.length == 0) {
        listContainer.createEl('p', { text: 'No tags found in the current note.' });
      } else {
        listContainer.createEl('h3', { text: '标签信息:' });
        const list = listContainer.createEl('ul');
        tagArray.sort();
        tagArray.map(item => {
          let filterTag = `#${item[0]}`;
    
          // 查找包含指定内容的所有行号
          const lineNumbers = lines.reduce((acc, line, index) => {
            if (line.includes(filterTag)) {
              acc.push(index + 1); // 行号从1开始
            }
            return acc;
          }, []);
    
          let result = undefined;
          if (lineNumbers.length == 0) {
            result="-1";
          } else {
            result = lineNumbers.join(',');
          }

          const listItem = list.createEl('li');
          listItem.createSpan({ text: `${item[0]} (line ` });
          lineNumbers.forEach((line, index) => {
            const link = listItem.createEl('a', { text: `${line}`, href: '#' });
            link.addEventListener('click', (e) => {
              e.preventDefault();
              if (preview) {
                //this.previewScroll(view.renderer, line-1)
              } else {
                this.editorScroll(editor, line-1);
              }
            });

            if (index < lineNumbers.length - 1) {
              listItem.appendText(', ');
            }
          });
          listItem.appendText(')');
        });
      }
    })
  }

  editorScroll(editor: Editor, line: number) {
    const selection = {
      from: { line, ch: 0 },
      to: { line, ch: editor.getLine(line).length },
    }
    editor.addHighlights([selection], "is-flashing", true, true);
    editor.setCursor(selection.from);
    editor.scrollIntoView(selection, true);	
  }

  async onClose() {
    // Nothing to clean up.
  }
}