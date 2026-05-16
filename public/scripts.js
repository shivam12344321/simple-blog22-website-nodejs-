// ============================================
// Blog Website - JavaScript Functionality
// ============================================

// DOM Elements
const deleteButtons = document.querySelectorAll('[data-action="delete"]');
const editButtons = document.querySelectorAll('[data-action="edit"]');
const confirmDeleteModals = document.querySelectorAll('.delete-confirm-modal');
const commentForm = document.getElementById('commentForm');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('📝 Blog Website Loaded');
  
  // Initialize event listeners
  initializeDeleteButtons();
  initializeEditButtons();
  initializeTheme();
  initializeSearch();
  initializeComments();
});

// ============================================
// Delete Post Functionality
// ============================================
function initializeDeleteButtons() {
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const postId = button.getAttribute('data-post-id');
      showDeleteConfirmation(postId);
    });
  });
}

function showDeleteConfirmation(postId) {
  const confirmed = confirm('⚠️ Are you sure you want to delete this post? This action cannot be undone.');
  
  if (confirmed) {
    deletePost(postId);
  }
}

async function deletePost(postId) {
  try {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/posts/delete/${postId}`;
    
    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('❌ Failed to delete post. Please try again.');
  }
}

// ============================================
// Edit Post Functionality
// ============================================
function initializeEditButtons() {
  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const postId = button.getAttribute('data-post-id');
      window.location.href = `/posts/edit/${postId}`;
    });
  });
}

// ============================================
// Form Validation
// ============================================
function validateForm(formId) {
  const form = document.getElementById(formId);
  
  if (!form) return true;

  const title = form.querySelector('[name="title"]');
  const content = form.querySelector('[name="content"]');
  const email = form.querySelector('[name="email"]');
  const password = form.querySelector('[name="password"]');
  const confirmPassword = form.querySelector('[name="confirmPassword"]');

  // Clear previous errors
  clearFormErrors(form);

  let isValid = true;

  // Validate title
  if (title && title.value.trim().length < 3) {
    showFieldError(title, 'Title must be at least 3 characters');
    isValid = false;
  }

  // Validate content
  if (content && content.value.trim().length < 10) {
    showFieldError(content, 'Content must be at least 10 characters');
    isValid = false;
  }

  // Validate email
  if (email && !isValidEmail(email.value)) {
    showFieldError(email, 'Please enter a valid email');
    isValid = false;
  }

  // Validate password
  if (password && password.value.length < 6) {
    showFieldError(password, 'Password must be at least 6 characters');
    isValid = false;
  }

  // Validate password confirmation
  if (confirmPassword && password && confirmPassword.value !== password.value) {
    showFieldError(confirmPassword, 'Passwords do not match');
    isValid = false;
  }

  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFieldError(field, message) {
  field.classList.add('error');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = '❌ ' + message;
  
  field.parentNode.appendChild(errorDiv);
}

function clearFormErrors(form) {
  const errorDivs = form.querySelectorAll('.field-error');
  const errorFields = form.querySelectorAll('.error');
  
  errorDivs.forEach(div => div.remove());
  errorFields.forEach(field => field.classList.remove('error'));
}

// Add form validation on submit
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', function(e) {
    // Skip validation for logout and delete forms
    if (this.method === 'POST' && this.action.includes('delete')) {
      return;
    }
    if (this.action.includes('logout')) {
      return;
    }

    if (!validateForm(this.id)) {
      e.preventDefault();
    }
  });
});

// ============================================
// Search Functionality
// ============================================
function initializeSearch() {
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const postCards = document.querySelectorAll('.post-card');

    postCards.forEach(card => {
      const title = card.querySelector('h3') || card.querySelector('h2');
      const content = card.querySelector('.post-content-preview');
      
      const titleText = title ? title.textContent.toLowerCase() : '';
      const contentText = content ? content.textContent.toLowerCase() : '';

      const matches = titleText.includes(searchTerm) || contentText.includes(searchTerm);
      
      if (searchTerm === '') {
        card.style.display = '';
      } else {
        card.style.display = matches ? '' : 'none';
      }
    });

    // Show no results message
    updateSearchResults();
  });
}

function updateSearchResults() {
  const visibleCards = document.querySelectorAll('.post-card:not([style*="display: none"])');
  const noResultsMsg = document.querySelector('.no-search-results');

  if (visibleCards.length === 0 && searchInput.value.trim() !== '') {
    if (!noResultsMsg) {
      const msg = document.createElement('p');
      msg.className = 'no-search-results';
      msg.textContent = '🔍 No posts found matching your search.';
      
      const postsGrid = document.querySelector('.posts-grid');
      if (postsGrid) {
        postsGrid.parentNode.insertBefore(msg, postsGrid);
      }
    }
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }
}

// ============================================
// Theme Toggle (Dark/Light Mode)
// ============================================
function initializeTheme() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
  }
}

// ============================================
// Comments Functionality
// ============================================
function initializeComments() {
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitComment();
    });
  }
}

async function submitComment() {
  const content = document.getElementById('commentContent');
  
  if (!content || !content.value.trim()) {
    alert('Please enter a comment');
    return;
  }

  try {
    const postId = document.getElementById('postId').value;
    
    const response = await fetch(`/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content.value })
    });

    if (response.ok) {
      content.value = '';
      location.reload(); // Reload to show new comment
    } else {
      alert('❌ Failed to post comment');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('❌ Error posting comment');
  }
}

// ============================================
// Character Counter for Textarea
// ============================================
function initializeCharacterCounter() {
  const textareas = document.querySelectorAll('textarea[data-counter]');

  textareas.forEach(textarea => {
    const counter = document.querySelector(`[data-counter-id="${textarea.id}"]`);
    
    if (counter) {
      textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length} characters`;
      });

      // Initialize counter
      counter.textContent = `${textarea.value.length} characters`;
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeCharacterCounter);

// ============================================
// Auto-save Draft
// ============================================
function initializeAutoSave() {
  const titleInput = document.querySelector('input[name="title"]');
  const contentInput = document.querySelector('textarea[name="content"]');

  if (!titleInput || !contentInput) return;

  // Load draft if exists
  const savedTitle = localStorage.getItem('draft_title');
  const savedContent = localStorage.getItem('draft_content');

  if (savedTitle) titleInput.value = savedTitle;
  if (savedContent) contentInput.value = savedContent;

  // Auto-save on input
  const autoSave = () => {
    localStorage.setItem('draft_title', titleInput.value);
    localStorage.setItem('draft_content', contentInput.value);
  };

  titleInput.addEventListener('input', autoSave);
  contentInput.addEventListener('input', autoSave);

  // Clear draft on successful form submission
  document.querySelector('form')?.addEventListener('submit', () => {
    localStorage.removeItem('draft_title');
    localStorage.removeItem('draft_content');
  });
}

document.addEventListener('DOMContentLoaded', initializeAutoSave);

// ============================================
// Copy to Clipboard
// ============================================
function copyToClipboard(text, buttonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = '✅ Copied!';
    
    setTimeout(() => {
      buttonElement.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
}

// ============================================
// Smooth Scrolling
// ============================================
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initializeSmoothScroll);

// ============================================
// Loading State Management
// ============================================
function showLoading(element = document.body) {
  const spinner = document.createElement('div');
  spinner.className = 'spinner-overlay';
  spinner.id = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner">
      <div></div>
      <div></div>
      <div></div>
    </div>
  `;
  element.appendChild(spinner);
}

function hideLoading() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.remove();
}

// ============================================
// Tooltip Functionality
// ============================================
function initializeTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');

  tooltips.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(e) {
  const tooltipText = e.target.getAttribute('data-tooltip');
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = tooltipText;

  document.body.appendChild(tooltip);

  const rect = e.target.getBoundingClientRect();
  tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
  tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
}

function hideTooltip() {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) tooltip.remove();
}

document.addEventListener('DOMContentLoaded', initializeTooltips);

// ============================================
// Notification System
// ============================================
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${getNotificationIcon(type)}</span>
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  // Add to top of page
  document.body.insertBefore(notification, document.body.firstChild);

  // Auto-remove after duration
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

// ============================================
// Confirm Action Dialog
// ============================================
function confirmAction(message, callback) {
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog-overlay';
  dialog.innerHTML = `
    <div class="confirm-dialog">
      <p>${message}</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary cancel-btn">Cancel</button>
        <button class="btn btn-danger confirm-btn">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const confirmBtn = dialog.querySelector('.confirm-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');

  confirmBtn.addEventListener('click', () => {
    callback(true);
    dialog.remove();
  });

  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });

  // Close on overlay click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.remove();
  });
}

// ============================================
// Lazy Load Images
// ============================================
function initializeLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

document.addEventListener('DOMContentLoaded', initializeLazyLoad);

// ============================================
// Format Date/Time
// ============================================
function formatDate(dateString, format = 'short') {
  const date = new Date(dateString);
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  return date.toLocaleDateString('en-US', options[format] || options.short);
}

// ============================================
// Keyboard Shortcuts
// ============================================
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeKeyboardShortcuts);

// ============================================
// Utility Functions
// ============================================

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Export for use in other scripts
// ============================================
window.BlogUtils = {
  showNotification,
  confirmAction,
  showLoading,
  hideLoading,
  debounce,
  throttle,
  getUrlParameter,
  escapeHtml,
  formatDate
};

console.log('✅ All scripts loaded successfully!');
