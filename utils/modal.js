/**
 * Trigger opening the modal
 */
export function triggerModalOpen() {
  window.location.hash = '#signup';
}

export function triggerModalClose() {
  window.location.hash = '';
}
