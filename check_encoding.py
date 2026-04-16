import sys
import chardet

files = [
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Ocorrencias\Index.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_Layout.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Views\Shared\_FortunaLayout.cshtml",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Relatorios\PontoEletronico.aspx",
    r"d:\0000000-PROJETOS\projetos_marcasite\real-serv\Web.config"
]

for filepath in files:
    try:
        with open(filepath, 'rb') as f:
            rawdata = f.read()
            result = chardet.detect(rawdata)
            print(f"{filepath}: {result['encoding']} (confidence: {result['confidence']})")
    except Exception as e:
        print(f"Error checking {filepath}: {e}")
