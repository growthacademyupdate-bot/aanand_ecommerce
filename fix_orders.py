import re

with open(r'src\app\api\orders\route.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace lines 451-458
new_lines = []
skip_until = None
for i, line in enumerate(lines):
    line_num = i + 1
    if line_num == 451:
        # Replace with new size-aware stock check
        new_lines.append('          // Use size-specific stock if size is provided and variant has sizes\n')
        new_lines.append('          if (item.size && colorVariant.hasSizes && colorVariant.sizes) {\n')
        new_lines.append('            availableStock = colorVariant.sizes[item.size] || 0;\n')
        new_lines.append('            console.log(`Size stock for ${item.color}, size ${item.size}: ${availableStock}`);\n')
        new_lines.append('          } else {\n')
        new_lines.append('            availableStock = colorVariant.stock || 0;\n')
        new_lines.append('            console.log(`Color stock for ${item.color}: ${availableStock}`);\n')
        new_lines.append('          }\n')
        skip_until = 458
    elif skip_until and line_num <= skip_until:
        continue
    else:
        new_lines.append(line)

with open(r'src\app\api\orders\route.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Successfully updated stock validation logic')
