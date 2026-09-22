from pathlib import Path
from reportlab.pdfgen import canvas
from PIL import Image

source_dir = Path(r"C:\Users\Maharaj\AppData\Local\Temp\mast-guide-site-screenshots")
output_path = Path(r"D:\Programs\Webapps\MAST Test V3\output\pdf\MAST_Guide_Website_View.pdf")

route_order = ["guide", "m", "a", "s", "t", "vivek"]
images = []
for route in route_order:
    images.extend(sorted(source_dir.glob(f"{route}-*.png")))

if not images:
    raise RuntimeError("No website screenshots were found.")

output_path.parent.mkdir(parents=True, exist_ok=True)
with Image.open(images[0]) as first:
    page_size = first.size

pdf = canvas.Canvas(str(output_path), pagesize=page_size)
pdf.setTitle("MAST Guide - Website View")

for image_path in images:
    with Image.open(image_path) as image:
        width, height = image.size
    if (width, height) != page_size:
        raise RuntimeError(f"Unexpected screenshot size: {image_path.name}")
    pdf.drawImage(str(image_path), 0, 0, width=width, height=height, preserveAspectRatio=True, mask="auto")
    pdf.showPage()

pdf.save()
print(f"Created {output_path} with {len(images)} screenshot pages.")
