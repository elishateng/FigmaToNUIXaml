
export const CODE_VIEW_ID = '__VIEW_ID__'
export const CODE_KEYWORD = '__CODE__'
export const XAML_TMPL =
`
<?xml version="1.0" encoding="UTF-8" ?>
<ContentPage x:Class="NUIAppSample.__VIEW_ID__"
  xmlns="http://tizen.org/Tizen.NUI/2018/XAML"
  xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
  WidthSpecification="{Static LayoutParamPolicies.MatchParent}"
  HeightSpecification="{Static LayoutParamPolicies.MatchParent}">

    <!-- Content is main placeholder of ContentPage. Add your content into this view. -->
    <ContentPage.Content>
        __CODE__
    </ContentPage.Content>
</ContentPage>
`