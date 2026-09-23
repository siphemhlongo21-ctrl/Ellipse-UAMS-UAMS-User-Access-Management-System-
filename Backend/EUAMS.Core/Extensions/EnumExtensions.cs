using System.ComponentModel;

namespace EUAMS.Core.Extensions
{
    public static class EnumExtensions
    {
        public static string GetDescription(this Enum value)
        {
            var type = value.GetType();

            if (type == null)
            {
                return string.Empty;
            }

            var name = Enum.GetName(type, value);

            if (name != null)
            {
                var field = type.GetField(name);

                if (field != null)
                {
                    if (Attribute.GetCustomAttribute(field, typeof(DescriptionAttribute)) is DescriptionAttribute attr)
                    {
                        return attr.Description;
                    }

                    return field.Name;
                }
            }

            return string.Empty;
        }
    }
}
