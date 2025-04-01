import { getSliderState, getToggleState, getComboBoxState, getNativeFunction, getBackendResourceAddress } from './index.js';

// Explicitly expose these functions globally
window.__JUCE__.getSliderState = getSliderState;
window.__JUCE__.getToggleState = getToggleState;
window.__JUCE__.getComboBoxState = getComboBoxState;
window.__JUCE__.getNativeFunction = getNativeFunction;
window.__JUCE__.getBackendResourceAddress = getBackendResourceAddress;

console.log('JUCE API explicitly initialized');
