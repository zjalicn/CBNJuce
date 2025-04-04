#include "PluginProcessor.h"
#include "PluginEditor.h"

CBNJuceAudioProcessor::CBNJuceAudioProcessor()
    : AudioProcessor(BusesProperties()
                         .withInput("Input", juce::AudioChannelSet::stereo(), true)
                         .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    // Create our gain parameters with a range of -24dB to +24dB, default of 0dB (unity gain)
    addParameter(gainParameter = new juce::AudioParameterFloat("gain", "Gain", -24.0f, 24.0f, 0.0f));
    addParameter(inputGainParameter = new juce::AudioParameterFloat("inputGain", "Input Gain", -24.0f, 24.0f, 0.0f));
    addParameter(outputGainParameter = new juce::AudioParameterFloat("outputGain", "Output Gain", -24.0f, 24.0f, 0.0f));
}

CBNJuceAudioProcessor::~CBNJuceAudioProcessor()
{
}

const juce::String CBNJuceAudioProcessor::getName() const
{
    return "CBNJuce";
}

bool CBNJuceAudioProcessor::acceptsMidi() const
{
    return false;
}

bool CBNJuceAudioProcessor::producesMidi() const
{
    return false;
}

bool CBNJuceAudioProcessor::isMidiEffect() const
{
    return false;
}

double CBNJuceAudioProcessor::getTailLengthSeconds() const
{
    return 0.0;
}

int CBNJuceAudioProcessor::getNumPrograms()
{
    return 1;
}

int CBNJuceAudioProcessor::getCurrentProgram()
{
    return 0;
}

void CBNJuceAudioProcessor::setCurrentProgram(int index)
{
    juce::ignoreUnused(index);
}

const juce::String CBNJuceAudioProcessor::getProgramName(int index)
{
    juce::ignoreUnused(index);
    return {};
}

void CBNJuceAudioProcessor::changeProgramName(int index, const juce::String &newName)
{
    juce::ignoreUnused(index, newName);
}

void CBNJuceAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused(sampleRate, samplesPerBlock);
}

void CBNJuceAudioProcessor::releaseResources()
{
}

bool CBNJuceAudioProcessor::isBusesLayoutSupported(const BusesLayout &layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono() && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;

    return true;
}

void CBNJuceAudioProcessor::processBlock(juce::AudioBuffer<float> &buffer, juce::MidiBuffer &midiMessages)
{
    juce::ignoreUnused(midiMessages);

    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    // Clear any output channels that don't contain input data
    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear(i, 0, buffer.getNumSamples());

    // Get the current gain values from our parameters (in dB)
    float currentInputGainDB = inputGainParameter->get();
    float currentGainDB = gainParameter->get();
    float currentOutputGainDB = outputGainParameter->get();

    // Safety check to prevent -infinity issues
    const float minSafeDbValue = -100.0f; // -100dB is close enough to silence for audio purposes
    currentInputGainDB = std::max(minSafeDbValue, currentInputGainDB);
    currentGainDB = std::max(minSafeDbValue, currentGainDB);
    currentOutputGainDB = std::max(minSafeDbValue, currentOutputGainDB);

    // Convert from dB to linear gain factors
    float currentInputGain = juce::Decibels::decibelsToGain(currentInputGainDB);
    float currentGain = juce::Decibels::decibelsToGain(currentGainDB);
    float currentOutputGain = juce::Decibels::decibelsToGain(currentOutputGainDB);

    // Create a copy of the input buffer for input metering before any processing
    juce::AudioBuffer<float> inputBuffer;
    inputBuffer.makeCopyOf(buffer);

    // Measure input levels before applying any gain
    if (totalNumInputChannels >= 1)
    {
        auto *channelData = inputBuffer.getReadPointer(0);
        float maxLevel = 0.0f;

        for (int i = 0; i < inputBuffer.getNumSamples(); ++i)
        {
            maxLevel = std::max(maxLevel, std::abs(channelData[i]));
        }

        // Smooth the level and apply input gain for display
        float newLevel = maxLevel * currentInputGain;
        inputLevelLeft = inputLevelLeft.load() * levelSmoothing + newLevel * (1.0f - levelSmoothing);
    }

    if (totalNumInputChannels >= 2)
    {
        auto *channelData = inputBuffer.getReadPointer(1);
        float maxLevel = 0.0f;

        for (int i = 0; i < inputBuffer.getNumSamples(); ++i)
        {
            maxLevel = std::max(maxLevel, std::abs(channelData[i]));
        }

        // Smooth the level and apply input gain for display
        float newLevel = maxLevel * currentInputGain;
        inputLevelRight = inputLevelRight.load() * levelSmoothing + newLevel * (1.0f - levelSmoothing);
    }

    // Apply input gain to all channels
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto *channelData = buffer.getWritePointer(channel);

        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            channelData[sample] *= currentInputGain;
        }
    }

    // Apply main gain to all channels
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto *channelData = buffer.getWritePointer(channel);

        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            channelData[sample] *= currentGain;
        }
    }

    // Measure output levels after main gain but before output gain
    // Create a copy of the current buffer for output metering
    juce::AudioBuffer<float> outputBuffer;
    outputBuffer.makeCopyOf(buffer);

    if (totalNumOutputChannels >= 1)
    {
        auto *channelData = outputBuffer.getReadPointer(0);
        float maxLevel = 0.0f;

        for (int i = 0; i < outputBuffer.getNumSamples(); ++i)
        {
            maxLevel = std::max(maxLevel, std::abs(channelData[i]));
        }

        // Smooth the level and apply output gain for display purposes
        float newLevel = maxLevel * currentOutputGain;
        outputLevelLeft = outputLevelLeft.load() * levelSmoothing + newLevel * (1.0f - levelSmoothing);
    }

    if (totalNumOutputChannels >= 2)
    {
        auto *channelData = outputBuffer.getReadPointer(1);
        float maxLevel = 0.0f;

        for (int i = 0; i < outputBuffer.getNumSamples(); ++i)
        {
            maxLevel = std::max(maxLevel, std::abs(channelData[i]));
        }

        // Smooth the level and apply output gain for display purposes
        float newLevel = maxLevel * currentOutputGain;
        outputLevelRight = outputLevelRight.load() * levelSmoothing + newLevel * (1.0f - levelSmoothing);
    }

    // Apply output gain to all channels
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto *channelData = buffer.getWritePointer(channel);

        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            channelData[sample] *= currentOutputGain;
        }
    }
}

bool CBNJuceAudioProcessor::hasEditor() const
{
    return true;
}

juce::AudioProcessorEditor *CBNJuceAudioProcessor::createEditor()
{
    return new CBNJuceAudioProcessorEditor(*this);
}

void CBNJuceAudioProcessor::getStateInformation(juce::MemoryBlock &destData)
{
    // Save parameter states to memory block
    juce::MemoryOutputStream stream(destData, true);
    stream.writeFloat(*gainParameter);       // Save gain value
    stream.writeFloat(*inputGainParameter);  // Save input gain value
    stream.writeFloat(*outputGainParameter); // Save output gain value
}

void CBNJuceAudioProcessor::setStateInformation(const void *data, int sizeInBytes)
{
    // Restore parameter states from memory block
    juce::MemoryInputStream stream(data, static_cast<size_t>(sizeInBytes), false);

    if (stream.getDataSize() > 0)
    {
        *gainParameter = stream.readFloat(); // Restore gain value

        // Check if we have more data (for backward compatibility)
        if (!stream.isExhausted())
        {
            *inputGainParameter = stream.readFloat();  // Restore input gain
            *outputGainParameter = stream.readFloat(); // Restore output gain
        }
    }
}

juce::AudioProcessor *JUCE_CALLTYPE createPluginFilter()
{
    return new CBNJuceAudioProcessor();
}