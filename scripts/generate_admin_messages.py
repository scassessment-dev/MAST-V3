from __future__ import annotations

import json
import re
import secrets
import string
from pathlib import Path

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "Stuff" / "Zonal Center_21-05-2026.xlsx"
OUTPUT_DIR = ROOT / "output"
PDF_DIR = OUTPUT_DIR / "pdf"
JSON_PATH = OUTPUT_DIR / "admin-credentials.json"
MD_PATH = OUTPUT_DIR / "admin-login-messages.md"
PDF_PATH = PDF_DIR / "MAST_Admin_Login_Messages.pdf"
ADMIN_URL = "https://mastassessment-admin.netlify.app"


def slugify_dot(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", ".", value.lower()).strip(".")


def slugify_id(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def make_password(label: str) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


def load_rows() -> list[dict[str, str | int]]:
    df = pd.read_excel(WORKBOOK)
    rows: list[dict[str, str | int]] = []
    for _, item in df.iterrows():
        rows.append(
            {
                "no": int(item["No"]),
                "zone": str(item["Zone"]),
                "center": str(item["Center"]),
            }
        )
    return rows


def message(name: str, email: str, password: str, scope: str, gender_scope: str) -> str:
    return "\n".join(
        [
            "Jay Swaminarayan.",
            "MAST Assessment admin login details:",
            f"Admin URL: {ADMIN_URL}",
            f"ID: {email}",
            f"Password: {password}",
            f"Access Scope: {scope}",
            f"Gender Visibility: {gender_scope}",
            "Please keep this ID/password private and share only with the responsible admin.",
        ]
    )


def build_credentials() -> dict[str, object]:
    rows = load_rows()
    zones = sorted({str(row["zone"]) for row in rows})

    # 1. Main Master Admin (Access ALL Male & Female data across all zones & centers)
    main_master_pass = make_password("main_master")
    main_master_admin = {
        "role": "MASTER_ADMIN",
        "name": "Main Master Admin (All Data)",
        "email": "main.master@mast.local",
        "password": main_master_pass,
        "genderScope": "All",
        "zone": None,
        "center": None,
        "zoneId": None,
        "centerId": None,
        "message": message(
            "Main Master Admin",
            "main.master@mast.local",
            main_master_pass,
            "All zones and centers",
            "Both Male & Female Data"
        ),
    }

    # 2. Male Master Admin
    male_master_pass = make_password("male_master")
    male_master_admin = {
        "role": "MASTER_ADMIN",
        "name": "Male Master Admin",
        "email": "master@mast.local",
        "password": male_master_pass,
        "genderScope": "Male",
        "zone": None,
        "center": None,
        "zoneId": None,
        "centerId": None,
        "message": message(
            "Male Master Admin",
            "master@mast.local",
            male_master_pass,
            "All zones and centers",
            "Male Data Only"
        ),
    }

    # 3. Female Master Admin (starts with f.)
    female_master_pass = make_password("female_master")
    female_master_admin = {
        "role": "MASTER_ADMIN",
        "name": "Female Master Admin",
        "email": "f.master@mast.local",
        "password": female_master_pass,
        "genderScope": "Female",
        "zone": None,
        "center": None,
        "zoneId": None,
        "centerId": None,
        "message": message(
            "Female Master Admin",
            "f.master@mast.local",
            female_master_pass,
            "All zones and centers",
            "Female Data Only"
        ),
    }

    # 4. Zone Admins (Male & Female for each zone)
    zone_admins = []
    for zone in zones:
        zone_id = f"zone-{slugify_id(zone)}"
        slug = slugify_dot(zone)

        # Male Zone Admin
        m_email = f"{slug}@mast.local"
        m_pass = make_password(f"m_{zone}")
        zone_admins.append(
            {
                "role": "ZONE_ADMIN",
                "name": f"{zone} Male Zone Admin",
                "email": m_email,
                "password": m_pass,
                "genderScope": "Male",
                "zone": zone,
                "center": None,
                "zoneId": zone_id,
                "centerId": None,
                "message": message(f"{zone} Male Zone Admin", m_email, m_pass, f"{zone} zone", "Male Data Only"),
            }
        )

        # Female Zone Admin (starts with f.)
        f_email = f"f.{slug}@mast.local"
        f_pass = make_password(f"f_{zone}")
        zone_admins.append(
            {
                "role": "ZONE_ADMIN",
                "name": f"{zone} Female Zone Admin",
                "email": f_email,
                "password": f_pass,
                "genderScope": "Female",
                "zone": zone,
                "center": None,
                "zoneId": zone_id,
                "centerId": None,
                "message": message(f"{zone} Female Zone Admin", f_email, f_pass, f"{zone} zone", "Female Data Only"),
            }
        )

    # 5. Center Admins (Male & Female for each center)
    center_admins = []
    seen_emails: set[str] = set()
    for row in rows:
        zone = str(row["zone"])
        center = str(row["center"])
        no = int(row["no"])
        center_id = f"center-{no}"
        c_slug = slugify_dot(center)

        # Male Center Admin
        m_base_email = f"{c_slug}.{no}@mast.local"
        m_email = m_base_email
        suffix = 2
        while m_email in seen_emails:
            m_email = f"{c_slug}.{no}.{suffix}@mast.local"
            suffix += 1
        seen_emails.add(m_email)
        m_pass = make_password(f"m_{center}")
        center_admins.append(
            {
                "role": "CENTER_ADMIN",
                "name": f"{center} Male Center Admin",
                "email": m_email,
                "password": m_pass,
                "genderScope": "Male",
                "zone": zone,
                "center": center,
                "zoneId": f"zone-{slugify_id(zone)}",
                "centerId": center_id,
                "message": message(f"{center} Male Center Admin", m_email, m_pass, f"{center} center", "Male Data Only"),
            }
        )

        # Female Center Admin (starts with f.)
        f_base_email = f"f.{c_slug}.{no}@mast.local"
        f_email = f_base_email
        suffix = 2
        while f_email in seen_emails:
            f_email = f"f.{c_slug}.{no}.{suffix}@mast.local"
            suffix += 1
        seen_emails.add(f_email)
        f_pass = make_password(f"f_{center}")
        center_admins.append(
            {
                "role": "CENTER_ADMIN",
                "name": f"{center} Female Center Admin",
                "email": f_email,
                "password": f_pass,
                "genderScope": "Female",
                "zone": zone,
                "center": center,
                "zoneId": f"zone-{slugify_id(zone)}",
                "centerId": center_id,
                "message": message(f"{center} Female Center Admin", f_email, f_pass, f"{center} center", "Female Data Only"),
            }
        )

    return {
        "adminUrl": ADMIN_URL,
        "mainMasterAdmin": main_master_admin,
        "maleMasterAdmin": male_master_admin,
        "femaleMasterAdmin": female_master_admin,
        "mainAdmin": main_master_admin,  # Backwards compatibility
        "zoneAdmins": zone_admins,
        "centerAdmins": center_admins,
    }


def write_markdown(credentials: dict[str, object]) -> None:
    lines = ["# MAST Admin Login Messages (Male & Female Scope Split)", ""]
    
    lines.extend(["## Master Admins", ""])
    for admin_key in ["mainMasterAdmin", "maleMasterAdmin", "femaleMasterAdmin"]:
        admin = credentials[admin_key]
        lines.extend([f"### {admin['name']}", "", "```text", admin["message"], "```", ""])

    lines.extend(["## Zone Admins (Male & Female)", ""])
    for item in credentials["zoneAdmins"]:
        lines.extend([f"### {item['name']} ({item['zone']})", "", "```text", item["message"], "```", ""])

    lines.extend(["## Center Admins (Male & Female)", ""])
    for item in credentials["centerAdmins"]:
        lines.extend([f"### {item['name']} ({item['center']} / {item['zone']})", "", "```text", item["message"], "```", ""])

    MD_PATH.write_text("\n".join(lines), encoding="utf-8")


def pdf_fonts() -> tuple[str, str]:
    font_path = Path("C:/Windows/Fonts/shruti.ttf")
    bold_font_path = Path("C:/Windows/Fonts/shrutib.ttf")
    font_name = "Helvetica"
    bold_font_name = "Helvetica-Bold"
    if font_path.exists():
        font_name = "Shruti"
        pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
    if bold_font_path.exists():
        bold_font_name = "Shruti-Bold"
        pdfmetrics.registerFont(TTFont(bold_font_name, str(bold_font_path)))
    return font_name, bold_font_name


def write_pdf(credentials: dict[str, object]) -> None:
    styles = getSampleStyleSheet()
    font_name, bold_font_name = pdf_fonts()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName=bold_font_name,
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#172033"),
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName=font_name,
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#172033"),
    )

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title="MAST Admin Login Messages",
    )

    story = [
        Paragraph("MAST Admin Login Messages (Male & Female Scope Split)", title_style),
        Paragraph("Main Master, Male/Female Zone, and Male/Female Center admin credentials.", body_style),
        Spacer(1, 6),
    ]

    summary_rows = [["Role", "Gender Scope", "Scope", "ID", "Password"]]
    for k in ["mainMasterAdmin", "maleMasterAdmin", "femaleMasterAdmin"]:
        a = credentials[k]
        summary_rows.append(["MASTER", a["genderScope"], "All Data", a["email"], a["password"]])
    for item in credentials["zoneAdmins"]:
        summary_rows.append(["ZONE", item["genderScope"], item["zone"], item["email"], item["password"]])
    for item in credentials["centerAdmins"]:
        summary_rows.append(["CENTER", item["genderScope"], f"{item['center']} / {item['zone']}", item["email"], item["password"]])

    table = Table(summary_rows, colWidths=[18 * mm, 24 * mm, 45 * mm, 55 * mm, 44 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172033")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), bold_font_name),
                ("FONTNAME", (0, 1), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d7e1ee")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6f9fd")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(table)
    story.append(PageBreak())

    masters = [credentials["mainMasterAdmin"], credentials["maleMasterAdmin"], credentials["femaleMasterAdmin"]]
    sections = [("Master Admins", masters), ("Zone Admins", credentials["zoneAdmins"]), ("Center Admins", credentials["centerAdmins"])]
    for section_index, (title, items) in enumerate(sections):
        story.append(Paragraph(title, title_style))
        for index, item in enumerate(items):
            story.append(Paragraph(str(item["message"]).replace("\n", "<br/>"), body_style))
            if index != len(items) - 1:
                story.append(Spacer(1, 6))
        if section_index != len(sections) - 1:
            story.append(PageBreak())

    doc.build(story)


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    credentials = build_credentials()
    JSON_PATH.write_text(json.dumps(credentials, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(credentials)
    write_pdf(credentials)
    print(f"Successfully generated admin credentials file: {JSON_PATH}")
    print(f"Successfully generated markdown messages: {MD_PATH}")
    print(f"Successfully generated PDF: {PDF_PATH}")


if __name__ == "__main__":
    main()
