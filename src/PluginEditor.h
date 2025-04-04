#pragma once

#include "PluginProcessor.h"
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_extra/juce_gui_extra.h>

class CBNJuceAudioProcessorEditor : public juce::AudioProcessorEditor,
                                    private juce::Timer
{
public:
    explicit CBNJuceAudioProcessorEditor(CBNJuceAudioProcessor &);
    ~CBNJuceAudioProcessorEditor() override;

    void paint(juce::Graphics &) override;
    void resized() override;
    void timerCallback() override;

private:
    using Resource = juce::WebBrowserComponent::Resource;
    std::optional<Resource> getResource(const juce::String &url) const;

    void nativeFunction(const juce::Array<juce::var> &args,
                        juce::WebBrowserComponent::NativeFunctionCompletion completion);

    void updateMeterValues();

    CBNJuceAudioProcessor &processorRef;
    std::unique_ptr<juce::WebBrowserComponent> webView;

    // Gain parameter connection
    juce::WebSliderRelay gainRelay{"gain"};
    juce::WebSliderParameterAttachment gainAttachment;

    // Input and output gain parameter connections
    juce::WebSliderRelay inputGainRelay{"inputGain"};
    juce::WebSliderRelay outputGainRelay{"outputGain"};
    juce::WebSliderParameterAttachment inputGainAttachment;
    juce::WebSliderParameterAttachment outputGainAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(CBNJuceAudioProcessorEditor)
};