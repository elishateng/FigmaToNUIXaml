export const CSHARP_SOLUTION_TMPL = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29418.71
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "NUIAppSample", "NUIAppSample\\NUIAppSample.csproj", "{F09ECF01-C2AF-4CD8-B7F4-90B094DA1011}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{F09ECF01-C2AF-4CD8-B7F4-90B094DA1011}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{F09ECF01-C2AF-4CD8-B7F4-90B094DA1011}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{F09ECF01-C2AF-4CD8-B7F4-90B094DA1011}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{F09ECF01-C2AF-4CD8-B7F4-90B094DA1011}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {6E71F937-2FCA-4EDA-A6AA-C35268357239}
	EndGlobalSection
EndGlobal
`
export const CSHARP_MANIFEST_TMPL = `
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns="http://tizen.org/ns/packages" api-version="7" package="org.tizen.example.NUIAppSample" version="1.0.0">
  <profile name="common" />
  <ui-application appid="org.tizen.example.NUIAppSample"
					exec="NUIAppSample.dll"
					type="dotnet"
					multiple="false"
					taskmanage="true"
					nodisplay="false"
					launch_mode="single"
          >
    <label>NUIAppSample</label>
    <icon>NUIAppSample.png</icon>
    <metadata key="http://tizen.org/metadata/prefer_dotnet_aot" value="true" />
  </ui-application>
  <privileges>
    <privilege>http://tizen.org/privilege/internet</privilege>
    <privilege>http://tizen.org/privilege/appmanager.launch</privilege>
    <privilege>http://tizen.org/privilege/window.priority.set</privilege>
    <privilege>http://tizen.org/privilege/widget.viewer</privilege>
  </privileges>
</manifest>
`

export const CSHARP_PROJECT_TMPL = `
<Project Sdk="Tizen.NET.Sdk/1.1.8">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>tizen10.0</TargetFramework>
    <DisableImplicitTizenReference>True</DisableImplicitTizenReference>
  </PropertyGroup>

  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
    <DebugType>portable</DebugType>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Release|AnyCPU' ">
    <DebugType>None</DebugType>
  </PropertyGroup>

  <ItemGroup>
    <EmbeddedResource Include="xamls\\**\\*.xaml">
      <Generator>MSBuild:Compile</Generator>
    </EmbeddedResource>
  </ItemGroup>

  <ItemGroup>
    <Folder Include="lib\" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Tizen.NET" Version="10.0.0.17237" />
  </ItemGroup>

  <PropertyGroup>
    <XamlOptimization>1</XamlOptimization>
  </PropertyGroup>

</Project>
`

export const CSHARP_MAIN_VIEW_VARIABLES = '__CSHARP_MAIN_VIEW_VARIABLES__'
export const CSHARP_MAIN_PAGE_SET_CODE = '__CSHARP_MAIN_PAGE_SET_CODE__'
export const CSHAP_MAIN_TMPL = `
using System;
using System.Linq;
using System.Collections.Generic;
using Tizen.NUI;
using Tizen.NUI.Components;
using Tizen.NUI.BaseComponents;
using Tizen.NUI.Binding;
using System.Reflection;

namespace NUIAppSample
{
    class Program : NUIApplication
    {
        private Window window;
        private Navigator navigator;
        private Page currentExample = null;
        private ContentPage page;
        __CSHARP_MAIN_VIEW_VARIABLES__

        public void OnKeyEvent(object sender, Window.KeyEventArgs e)
        {
            if (e.Key.State == Key.StateType.Up)
            {
                if (e.Key.KeyPressedName == "Escape" || e.Key.KeyPressedName == "XF86Back" || e.Key.KeyPressedName == "BackSpace")
                {
                    currentExample = navigator.Peek();

                    if (exportedView1 == currentExample)
                        Exit();   
                    else
                        currentExample = navigator.Pop();
                }
            }
        }

        protected override void OnCreate()
        {
            base.OnCreate();
            Initialize();
            SetMainPage();
        }
        private void Initialize()
        {
            window = GetDefaultWindow();
            window.Title = "NUIAppSample";
            window.KeyEvent += OnKeyEvent;

            navigator = window.GetDefaultNavigator();
        }

        private void SetMainPage()
        {
            __CSHARP_MAIN_PAGE_SET_CODE__
        }

        private void ExitSample()
        {
            currentExample = navigator.Pop();
            FullGC();
        }

        private void FullGC()
        {
            global::System.GC.Collect();
            global::System.GC.WaitForPendingFinalizers();
            global::System.GC.Collect();
        }

        static void Main(string[] args)
        {
            var app = new Program();
            app.Run(args);
        }
    }
}
`

export const CSHARP_XAML_VIEW_ID = '__CSHARP_XAML_VIEW_ID__'
export const CSHARP_XAML_CS_TMPL = `
using Tizen.NUI.BaseComponents;
using Tizen.NUI.Components;

namespace NUIAppSample
{
    public partial class __CSHARP_XAML_VIEW_ID__ : ContentPage
    {
        public __CSHARP_XAML_VIEW_ID__()
        {
            InitializeComponent();
        }
    }
}
`