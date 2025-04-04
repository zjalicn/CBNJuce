#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <atomic>

class CBNJuceAudioProcessor : public juce::AudioProcessor
{
public:
    CBNJuceAudioProcessor();
    ~CBNJuceAudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported(const BusesLayout &layouts) const override;

    void processBlock(juce::AudioBuffer<float> &, juce::MidiBuffer &) override;

    juce::AudioProcessorEditor *createEditor() override;
    bool hasEditor() const override;

    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram(int index) override;
    const juce::String getProgramName(int index) override;
    void changeProgramName(int index, const juce::String &newName) override;

    void getStateInformation(juce::MemoryBlock &destData) override;
    void setStateInformation(const void *data, int sizeInBytes) override;

    juce::AudioParameterFloat *gainParameter;
    juce::AudioParameterFloat *inputGainParameter;
    juce::AudioParameterFloat *outputGainParameter;

    // Get meter levels (0.0 to 1.0)
    float getInputLevelLeft() const { return inputLevelLeft.load(); }
    float getInputLevelRight() const { return inputLevelRight.load(); }
    float getOutputLevelLeft() const { return outputLevelLeft.load(); }
    float getOutputLevelRight() const { return outputLevelRight.load(); }

private:
    // Level meters (atomic for thread safety)
    std::atomic<float> inputLevelLeft{0.0f};
    std::atomic<float> inputLevelRight{0.0f};
    std::atomic<float> outputLevelLeft{0.0f};
    std::atomic<float> outputLevelRight{0.0f};

    // Level smoothing
    float levelSmoothing{0.7f};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(CBNJuceAudioProcessor)
};