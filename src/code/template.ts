export const CODE_KEYWORD = '__CODE__'
export const XAML_TMPL =
`
<?xml version="1.0" encoding="UTF-8" ?>
<ContentPage x:Class="NUITizenGallery.HelloWorldPage"
  xmlns="http://tizen.org/Tizen.NUI/2018/XAML"
  xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
  WidthSpecification="{Static LayoutParamPolicies.MatchParent}"
  HeightSpecification="{Static LayoutParamPolicies.MatchParent}">

    <!-- AppBar is top-side bar with navigation content, title, and action. If you not set any contents, back button is automatically added. -->
    <ContentPage.AppBar>
        <AppBar x:Name="appBar" Title="HelloWorldPage"/>
    </ContentPage.AppBar>

    <!-- Content is main placeholder of ContentPage. Add your content into this view. -->
    <ContentPage.Content>
        __CODE__
    </ContentPage.Content>
</ContentPage>
`