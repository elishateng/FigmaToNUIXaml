export const XAML_CS_CODE = '__CODE__'
export const XAML_CS_CLASS_NAME = '__CLASS__'
export const XAML_CS_TMPL =
`
theme.AddStyleWithoutClone("Tizen.NUI.Components.__CLASS__", new __CLASS__Style()
{
    __CODE__
});
`