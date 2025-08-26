// Enhance code blocks with language attributes and icons
document.addEventListener('DOMContentLoaded', function() {
  // Add language data attributes to pre elements based on their class
  const codeBlocks = document.querySelectorAll('pre');
  
  codeBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (code) {
      // Extract language from class name (e.g., "language-swift" -> "swift")
      const classList = code.className.match(/language-(\w+)/);
      if (classList && classList[1]) {
        const language = classList[1];
        pre.setAttribute('data-language', language);
        
        // Map some language aliases
        const languageMap = {
          'js': 'javascript',
          'ts': 'typescript',
          'sh': 'bash',
          'shell': 'bash'
        };
        
        const normalizedLanguage = languageMap[language] || language;
        pre.setAttribute('data-language', normalizedLanguage);
      } else {
        // Default to plain if no language detected
        pre.setAttribute('data-language', 'plain');
      }
    }
  });
});