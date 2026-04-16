import os

files = [
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Ocorrencias\Index.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_Layout.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaLayout.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaNavigation.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaHeader.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Relatorios\PontoEletronico.aspx",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Web.config"
]

def check_and_fix(filepath):
    print(f"Processing: {filepath}")
    try:
        # Try to read as UTF-8
        try:
            with open(filepath, 'rb') as f:
                data = f.read()
            
            # Check for BOM
            if data.startswith(b'\xef\xbb\xbf'):
                print(f"{filepath}: Already UTF-8 with BOM")
                return

            # Try to decode as UTF-8
            data.decode('utf-8')
            print(f"{filepath}: Valid UTF-8, no BOM. Converting to UTF-8 with BOM...")
            content = data.decode('utf-8')
        except UnicodeDecodeError:
            # Try to decode as Latin-1
            print(f"{filepath}: Not UTF-8. Trying Latin-1...")
            content = data.decode('latin-1')
            print(f"{filepath}: Successfully decoded as Latin-1. Converting to UTF-8 with BOM...")

        # Write as UTF-8 with BOM
        with open(filepath, 'w', encoding='utf-8-sig') as f:
            f.write(content)
        print(f"{filepath}: Fixed to UTF-8 with BOM")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for f in files:
    check_and_fix(f)
