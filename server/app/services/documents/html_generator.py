from jinja2 import Environment, FileSystemLoader
import os


TEMPLATE_DIR = os.path.join(
    os.path.dirname(__file__), "templates"
)

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


def generate_html(template_name: str, data: dict, output_path: str):
    """
    Generate HTML using Jinja2 templates.
    """
    template = env.get_template(template_name)
    html = template.render(**data)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    return output_path