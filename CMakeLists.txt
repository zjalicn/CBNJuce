cmake_minimum_required(VERSION 3.15)
project(CBNJuce VERSION 1.0.0)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include JUCE
add_subdirectory(JUCE)

# Copy JUCE frontend library to plugin UI files
file(COPY "${CMAKE_CURRENT_SOURCE_DIR}/JUCE/modules/juce_gui_extra/native/javascript/" 
     DESTINATION "${CMAKE_CURRENT_SOURCE_DIR}/ui/public/jucejs/")

# Zip WebView files
set(WEBVIEW_FILES_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/ui/build")
set(WEBVIEW_FILES_ZIP_NAME "webview_files.zip")
set(TARGET_WEBVIEW_FILES_ZIP_PATH "${CMAKE_BINARY_DIR}/${WEBVIEW_FILES_ZIP_NAME}")

add_custom_target(ZipWebViewFiles
  COMMAND
  ${CMAKE_COMMAND} -E tar cvf
  "${TARGET_WEBVIEW_FILES_ZIP_PATH}"
  --format=zip
  .
  BYPRODUCTS
  "${TARGET_WEBVIEW_FILES_ZIP_PATH}"
  WORKING_DIRECTORY
  "${WEBVIEW_FILES_SOURCE_DIR}"
  COMMENT "Zipping WebView files..."
  VERBATIM
)

# Binary Resources
juce_add_binary_data(WebViewFiles
    HEADER_NAME WebViewFiles.h
    NAMESPACE webview_files
    SOURCES ${TARGET_WEBVIEW_FILES_ZIP_PATH}
)
add_dependencies(WebViewFiles ZipWebViewFiles)

# Main plugin target
juce_add_plugin(CBNJuce
    VERSION 1.0.0
    COMPANY_NAME "YourCompany"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    PLUGIN_MANUFACTURER_CODE YUCO
    PLUGIN_CODE CBNJ
    FORMATS VST3 Standalone # Include AU format on macOS if you're on Mac
    PRODUCT_NAME "CBNJuce"
    # Enable WebView features
    NEEDS_WEB_BROWSER TRUE
    # On Windows, use WebView2
    NEEDS_WEBVIEW2 TRUE
)

# Add source files
target_sources(CBNJuce
    PRIVATE
        src/PluginProcessor.cpp
        src/PluginEditor.cpp
)

# Setup target
target_compile_definitions(CBNJuce
    PRIVATE
        # JUCE_WEB_BROWSER=1 is important for using WebBrowserComponent
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        # This will enable WebView2 as the WebView backend on Windows
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
)

# Link against JUCE modules and our binary resources
target_link_libraries(CBNJuce
    PRIVATE
        WebViewFiles
        juce::juce_audio_utils
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# Add include directory
target_include_directories(CBNJuce
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Install Microsoft.Web.WebView2 NuGet package on Windows
if (MSVC)
  message(STATUS "Setting up WebView dependencies")
  file(MAKE_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/scripts)
  file(WRITE ${CMAKE_CURRENT_SOURCE_DIR}/scripts/DownloadWebView2.ps1 "
$packageSourceName = \"nugetRepository\"

# Ignore errors: they are meaningless
$ErrorActionPreference = \"SilentlyContinue\"

Register-PackageSource -Provider NuGet -Name $packageSourceName -Location https://api.nuget.org/v3/index.json -Force
Install-Package Microsoft.Web.WebView2 -Scope CurrentUser -RequiredVersion 1.0.1901.177 -Source $packageSourceName -Force
")

  execute_process(COMMAND pwsh -NoProfile -File scripts/DownloadWebView2.ps1
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
  RESULT_VARIABLE DOWNLOAD_WEBVIEW2_RESULT)

  if (NOT DOWNLOAD_WEBVIEW2_RESULT EQUAL 0)
      message(FATAL_ERROR "Failed to download Microsoft.Web.WebView2 NuGet package. Result: ${DOWNLOAD_WEBVIEW2_RESULT}")
  endif()
endif()