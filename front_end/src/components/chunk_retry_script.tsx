"use client";
import Script from "next/script";

const ChunkRetryScript = () => {
  return (
    <Script
      id="chunk-retry-script"
      dangerouslySetInnerHTML={{
        __html: `
          window.__failedChunks = new Set();

          function retryLoadChunk(url, maxRetries = 3) {
            if (window.__failedChunks.has(url)) return;
            
            let retries = 0;
            const loadScript = () => {
              if (retries >= maxRetries) {
                window.__failedChunks.add(url);
                return;
              }

              retries++;
              const script = document.createElement('script');
              script.src = url;
              script.async = true;
              script.onerror = () => {
                setTimeout(loadScript, 1000 * retries);
              };
              document.head.appendChild(script);
            };

            loadScript();
          }

          window.onerror = function(msg, url, lineNo, columnNo, error) {
            if (url?.includes('/_next/') && 
                (msg.includes('chunk') || msg.includes('Syntax'))) {
              retryLoadChunk(url);
            }
            return false;
          };

          window.addEventListener('error', function(event) {
            if (event.target?.tagName === 'SCRIPT') {
              const src = event.target.src;
              if (src.includes('/_next/')) {
                retryLoadChunk(src);
                event.preventDefault();
              }
            }
          }, true);
        `,
      }}
    />
  );
};

export default ChunkRetryScript;
