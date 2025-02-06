let isDesk = false;
let isSales = false;
async function findHeaderElement(retries = 3) {
  for (let i = 0; i < retries; i++) {
    let headerWrapper = document.querySelector('#default-header-wrapper');
    if (!headerWrapper) {
      headerWrapper = document.querySelector('.header-primary__user__item');
      if (headerWrapper) {
        isDesk = true;
      }
      if (!headerWrapper) {
        headerWrapper = document.querySelector('.navbar-personal-wrap');
        if (headerWrapper) {
          isSales = true;
        }
      }
    }

    if (headerWrapper) {
      return headerWrapper;
    }

    // Wait for 2 seconds before next retry
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return null;
}

async function createAgentButton() {
  let headerWrapper = await findHeaderElement();
  if (isSales) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    headerWrapper = await findHeaderElement(1);
  }
  if (headerWrapper) {
    // Pre-create iframe container
    const container = document.createElement('div');
    container.className = 'agent-iframe-container';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // × symbol
    closeButton.className = 'iframe-close-button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => {
      container.classList.remove('visible');
    });

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:5173?wsId=' + (isDesk ? '1' : isSales ? '1' : '1');
    iframe.className = 'agent-iframe';

    // Add elements to container
    container.appendChild(closeButton);
    container.appendChild(iframe);

    // Add click handler to close modal when clicking outside
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        container.classList.remove('visible');
      }
    });

    // Add container to body
    document.body.appendChild(container);

    // Create div container for button
    const containerDiv = document.createElement('div');
    containerDiv.className = 'calendar-icon-div get_started';

    // Create button with icon and text
    const button = document.createElement('button');
    const botIconSvg = `<svg style="width:20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><style>.cls-1{fill:#42a5f5}</style></defs><g id="Bot"><path class="cls-1" d="M10 16H8a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2a1 1 0 0 0 1-1V17a1 1 0 0 0-1-1zM40 16h-2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3zM33 16H15a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-15 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm8 4h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2zm4-4a2 2 0 1 1 2-2 2 2 0 0 1-2 2zM13 34v7.33L17 48h14l4-6.67V34zm14 9h-6a2 2 0 0 1 0-4h6a2 2 0 0 1 0 4z"/><path d="M42.5 38.13C34.91 33.8 35.38 34 35 34h-5.22l-.5-2H34a5 5 0 0 0 5-5V17a5 5 0 0 0-3-4.58v-7.2a3 3 0 1 0-4.38-.41L30.18 12H17.82l-1.44-7.19a3 3 0 1 0-4.38.41v7.2A5 5 0 0 0 9 17v10a5 5 0 0 0 5 5h4.72l-.5 2c-5.63 0-5.39 0-5.72.13C4.93 38.46 5 38.21 5 39v8a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1c0-8.71.18-8.48-.5-8.87zM34 2a1 1 0 0 1 0 2 1 1 0 0 1 0-2zm-.57 3.94A2.76 2.76 0 0 0 34 6v6h-1.78zM14 2a1 1 0 0 1 0 2 1 1 0 0 1 0-2zm1.78 10H14V6a2.76 2.76 0 0 0 .57-.06zM14 30a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3zm6.78 2h6.44l.5 2h-7.44zM41 46H7v-6.42L13.27 36h21.46L41 39.58z" style="fill:#424242"/></g></svg>`;
    button.innerHTML = `${botIconSvg}<span style="vertical-align: middle;">Launch Your AI Agent</span>`;
    button.className = isDesk ? 'nucleus-button nucleus-button--secondary' :
      isSales ? "fsa-custom-button fsa-btn-secondary" : 'btn chat-with-us';
    button.type = 'button';
    button.style.color = '#12344d';
    if (isSales) {
      button.style.marginRight = '12px';
    }

    // Add click handler
    button.addEventListener('click', () => {
      container.classList.add('visible');
    });

    // Add button to container div
    containerDiv.appendChild(button);

    // Insert as first element
    if (isSales) {
      headerWrapper.appendChild(containerDiv);
    }
    else if (headerWrapper.firstChild) {
      headerWrapper.insertBefore(containerDiv, headerWrapper.firstChild);
    } else {
      headerWrapper.appendChild(containerDiv);
    }
  }
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => createAgentButton());
} else {
  createAgentButton();
} 