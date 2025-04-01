#include "PluginProcessor.h"
#include "PluginEditor.h"

CBNJuceAudioProcessor::CBNJuceAudioProcessor()
    : AudioProcessor(BusesProperties()
                         .withInput("Input", juce::AudioChannelSet::stereo(), true)
                         .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    addParameter(gainParameter = new juce::AudioParameterFloat("gain", "Gain", 0.0f, 1.0f, 0.5f));
}

CBNJuceAudioProcessor::~CBNJuceAudioProcessor()
{
}

const juce::String CBNJuceAudioProcessor::getName() const
{
    return JucePlugin_Name;
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

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear(i, 0, buffer.getNumSamples());

    float currentGain = gainParameter->get();

    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto *channelData = buffer.getWritePointer(channel);
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            channelData[sample] *= currentGain;
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
    juce::MemoryOutputStream stream(destData, true);
    stream.writeFloat(*gainParameter);
}

void CBNJuceAudioProcessor::setStateInformation(const void *data, int sizeInBytes)
{
    juce::MemoryInputStream stream(data, static_cast<size_t>(sizeInBytes), false);
    if (stream.getDataSize() > 0)
        *gainParameter = stream.readFloat();
}

juce::AudioProcessor *JUCE_CALLTYPE createPluginFilter()
{
    return new CBNJuceAudioProcessor();
}