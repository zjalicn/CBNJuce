#include "PluginEditor.h"
#include <WebViewFiles.h>
#include <juce_core/juce_core.h>

namespace
{
    // Helper functions for resource handling
    std::vector<std::byte> streamToVector(juce::InputStream &stream)
    {
        using namespace juce;
        const auto sizeInBytes = static_cast<size_t>(stream.getTotalLength());
        std::vector<std::byte> result(sizeInBytes);
        stream.setPosition(0);
        [[maybe_unused]] const auto bytesRead = stream.read(result.data(), result.size());
        jassert(bytesRead == static_cast<ssize_t>(sizeInBytes));
        return result;
    }

    static const char *getMimeForExtension(const juce::String &extension)
    {
        static const std::unordered_map<juce::String, const char *> mimeMap = {
            {{"htm"}, "text/html"},
            {{"html"}, "text/html"},
            {{"txt"}, "text/plain"},
            {{"jpg"}, "image/jpeg"},
            {{"jpeg"}, "image/jpeg"},
            {{"svg"}, "image/svg+xml"},
            {{"ico"}, "image/vnd.microsoft.icon"},
            {{"json"}, "application/json"},
            {{"png"}, "image/png"},
            {{"css"}, "text/css"},
            {{"map"}, "application/json"},
            {{"js"}, "text/javascript"},
            {{"woff2"}, "font/woff2"}};

        if (const auto it = mimeMap.find(extension.toLowerCase()); it != mimeMap.end())
            return it->second;

        return "application/octet-stream";
    }

    // Get a file from the zipped WebView files
    std::vector<std::byte> getWebViewFileAsBytes(const juce::String &filepath)
    {
        juce::MemoryInputStream zipStream{webview_files::webview_files_zip,
                                          webview_files::webview_files_zipSize,
                                          false};
        juce::ZipFile zipFile{zipStream};

        if (auto *zipEntry = zipFile.getEntry(filepath))
        {
            const std::unique_ptr<juce::InputStream> entryStream{
                zipFile.createStreamForEntry(*zipEntry)};

            if (entryStream == nullptr)
                return {};

            return streamToVector(*entryStream);
        }

        return {};
    }

    constexpr auto LOCAL_DEV_SERVER_ADDRESS = "http://127.0.0.1:3000";
}

CBNJuceAudioProcessorEditor::CBNJuceAudioProcessorEditor(CBNJuceAudioProcessor &p)
    : AudioProcessorEditor(&p),
      processorRef(p),
      gainAttachment{*processorRef.gainParameter, gainRelay, nullptr}
{
    // Create WebView with JUCE 8's WebBrowserComponent
    webView = std::make_unique<juce::WebBrowserComponent>(
        juce::WebBrowserComponent::Options{}
            .withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
            .withWinWebView2Options(
                juce::WebBrowserComponent::Options::WinWebView2{}
                    .withBackgroundColour(juce::Colours::black)
                    .withUserDataFolder(juce::File::getSpecialLocation(
                        juce::File::SpecialLocationType::tempDirectory)))
            .withNativeIntegrationEnabled()
            .withResourceProvider(
                [this](const auto &url)
                { return getResource(url); },
                juce::URL{LOCAL_DEV_SERVER_ADDRESS}.getOrigin())
            .withInitialisationData("vendor", "YourCompany")
            .withInitialisationData("pluginName", "CBNJuce")
            .withInitialisationData("pluginVersion", "1.0.0")
            .withUserScript("console.log(\"C++ backend here: WebView initialized\");")
            .withEventListener(
                "paramChange",
                [this](juce::var objectFromFrontend)
                {
                    // Handle parameter changes from frontend
                    auto paramName = objectFromFrontend.getProperty("name", "").toString();
                    auto value = (float)objectFromFrontend.getProperty("value", 0.0);

                    if (paramName == "gain")
                    {
                        *processorRef.gainParameter = value;
                    }
                })
            .withNativeFunction(
                juce::Identifier{"nativeFunction"},
                [this](const juce::Array<juce::var> &args,
                       juce::WebBrowserComponent::NativeFunctionCompletion
                           completion)
                {
                    nativeFunction(args, std::move(completion));
                })
            .withOptionsFrom(gainRelay));

    // Add the WebView to the editor
    addAndMakeVisible(webView.get());

    // Load the content using the resource provider
    webView->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());

    // Set window size
    setSize(800, 600);

    // Start a timer to update parameters periodically
    startTimerHz(30);
}

CBNJuceAudioProcessorEditor::~CBNJuceAudioProcessorEditor()
{
}

void CBNJuceAudioProcessorEditor::paint(juce::Graphics &g)
{
    g.fillAll(juce::Colours::black);
}

void CBNJuceAudioProcessorEditor::resized()
{
    webView->setBounds(getLocalBounds());
}

void CBNJuceAudioProcessorEditor::timerCallback()
{
    // Update any UI elements that need periodic updates
    webView->emitEventIfBrowserIsVisible("paramUpdate", juce::var{});
}

auto CBNJuceAudioProcessorEditor::getResource(const juce::String &url) const
    -> std::optional<Resource>
{
    const auto resourceToRetrieve =
        url == "/" ? "index.html" : url.fromFirstOccurrenceOf("/", false, false);

    // First try to get resource from zip
    const auto resource = getWebViewFileAsBytes(resourceToRetrieve);
    if (!resource.empty())
    {
        const auto extension =
            resourceToRetrieve.fromLastOccurrenceOf(".", false, false);
        return Resource{std::move(resource), getMimeForExtension(extension)};
    }

    return std::nullopt;
}

void CBNJuceAudioProcessorEditor::nativeFunction(
    const juce::Array<juce::var> &args,
    juce::WebBrowserComponent::NativeFunctionCompletion completion)
{
    juce::String message = "Native function called with: ";
    for (const auto &arg : args)
    {
        message += arg.toString() + " ";
    }
    completion("Success from JUCE: " + message);
}