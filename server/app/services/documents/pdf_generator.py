from playwright.sync_api import sync_playwright
import os


def html_to_pdf(html_path: str, pdf_path: str, landscape: bool = False):

    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.goto(f"file:///{os.path.abspath(html_path)}")
        page.wait_for_timeout(300)

        page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            landscape=landscape
        )

        browser.close()

    return pdf_path