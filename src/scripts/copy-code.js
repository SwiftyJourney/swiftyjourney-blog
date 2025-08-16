// Auto-add copy buttons to all code blocks
document.addEventListener('DOMContentLoaded', function() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentNode;
    
    // Skip if copy button already exists
    if (pre.querySelector('.copy-button')) return;
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
    
    // Add language label if available
    const language = codeBlock.className.match(/language-(\w+)/)?.[1];
    if (language) {
      const languageLabel = document.createElement('span');
      languageLabel.className = 'language-label';
      languageLabel.textContent = language.toUpperCase();
      pre.appendChild(languageLabel);
    }
    
    // Copy functionality
    copyButton.addEventListener('click', async () => {
      try {
        const code = codeBlock.textContent || '';
        await navigator.clipboard.writeText(code);
        
        // Visual feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');
        
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('copied');
        }, 2000);
        
      } catch (err) {
        console.error('Failed to copy code:', err);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codeBlock.textContent || '';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');
        
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.classList.remove('copied');
        }, 2000);
      }
    });
    
    // Add button to pre element
    pre.appendChild(copyButton);
  });
});