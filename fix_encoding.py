import sys
import codecs

files = [
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Pessoas\Criar.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Handlers\PontoHandler_vFinal.ashx",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\PontoEletronico.aspx",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Handlers\LoginHandler.ashx",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaLayout.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaNavigation.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_Layout.cshtml"
]

def fix_encoding(filepath):
    try:
        # Try to read as UTF-8
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Write as UTF-8 with BOM (ASP.NET usually likes this)
        with open(filepath, 'w', encoding='utf-8-sig') as f:
            f.write(content)
        print(f"Fixed {filepath} to UTF-8 with BOM")
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

for f in files:
    fix_encoding(f)
