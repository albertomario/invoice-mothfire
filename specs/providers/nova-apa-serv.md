## Request AUTH cookie
curl 'https://www.apabotosani.ro/AuthService.svc/Authentificate' \
  --compressed \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Origin: https://www.apabotosani.ro' \
  -H 'Connection: keep-alive' \
  -H 'Referer: https://www.apabotosani.ro/pages/contulmeu.html' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'Priority: u=0' \
  --data-raw '{"username":"account@example.com","password":"secure-password","tipClient":0}'

Response:
{"Code":0,"Message":"login success"}
Note: Cookie should be kept between requests as no token is used.

## Listing paid invoices
curl 'https://www.apabotosani.ro/AuthService.svc/GetFacturiAchitate?tipAbonat=0&codAbonat=27800&_=1763284613521' \
  --compressed \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Connection: keep-alive' \
  -H 'Referer: https://www.apabotosani.ro/pages/contulmeu.html' \
  -H 'Cookie: ASP.NET_SessionId=COOKIE_FROM_PREVIOUS_REQUEST' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin'

Response:
[{"Achitat":0.91,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1762898400000+0200)\/","DataAsString":"12.11.2025","DataFact":"\/Date(1761861600000+0200)\/","DataFactAsString":"31.10.2025","Email":"alberto.burlacu93@gmail.com","Fact":17182201,"NrFact":22062549,"Numar":251112,"Restplata":0.00,"Total_factura":0.91},{"Achitat":107.12,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1762898400000+0200)\/","DataAsString":"12.11.2025","DataFact":"\/Date(1760648400000+0300)\/","DataFactAsString":"17.10.2025","Email":"alberto.burlacu93@gmail.com","Fact":17098132,"NrFact":22001196,"Numar":251112,"Restplata":0.00,"Total_factura":107.12},{"Achitat":103.99,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1760994000000+0300)\/","DataAsString":"21.10.2025","DataFact":"\/Date(1758056400000+0300)\/","DataFactAsString":"17.09.2025","Email":"alberto.burlacu93@gmail.com","Fact":16989511,"NrFact":21928489,"Numar":243,"Restplata":0.00,"Total_factura":103.99},{"Achitat":94.83,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1760994000000+0300)\/","DataAsString":"21.10.2025","DataFact":"\/Date(1755550800000+0300)\/","DataFactAsString":"19.08.2025","Email":"alberto.burlacu93@gmail.com","Fact":16880874,"NrFact":21855700,"Numar":243,"Restplata":0.00,"Total_factura":94.83},{"Achitat":0.12,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1757624400000+0300)\/","DataAsString":"12.09.2025","DataFact":"\/Date(1753909200000+0300)\/","DataFactAsString":"31.07.2025","Email":"alberto.burlacu93@gmail.com","Fact":16849079,"NrFact":21844239,"Numar":210,"Restplata":0.00,"Total_factura":0.12},{"Achitat":102.61,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1757624400000+0300)\/","DataAsString":"12.09.2025","DataFact":"\/Date(1752699600000+0300)\/","DataFactAsString":"17.07.2025","Email":"alberto.burlacu93@gmail.com","Fact":16770458,"NrFact":21783258,"Numar":210,"Restplata":0.00,"Total_factura":102.61},{"Achitat":0.89,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1752786000000+0300)\/","DataAsString":"18.07.2025","DataFact":"\/Date(1751230800000+0300)\/","DataFactAsString":"30.06.2025","Email":"alberto.burlacu93@gmail.com","Fact":16739919,"NrFact":21772098,"Numar":162,"Restplata":0.00,"Total_factura":0.89},{"Achitat":514.92,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1752181200000+0300)\/","DataAsString":"11.07.2025","DataFact":"\/Date(1750194000000+0300)\/","DataFactAsString":"18.06.2025","Email":"alberto.burlacu93@gmail.com","Fact":16665562,"NrFact":21712352,"Numar":156,"Restplata":0.00,"Total_factura":514.92},{"Achitat":97.78,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1750712400000+0300)\/","DataAsString":"24.06.2025","DataFact":"\/Date(1747602000000+0300)\/","DataFactAsString":"19.05.2025","Email":"alberto.burlacu93@gmail.com","Fact":16560494,"NrFact":21641779,"Numar":141,"Restplata":0.00,"Total_factura":97.78},{"Achitat":86.31,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1752786000000+0300)\/","DataAsString":"18.07.2025","DataFact":"\/Date(1744837200000+0300)\/","DataFactAsString":"17.04.2025","Email":"alberto.burlacu93@gmail.com","Fact":16459141,"NrFact":21572993,"Numar":162,"Restplata":0.00,"Total_factura":86.31},{"Achitat":86.19,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1744232400000+0300)\/","DataAsString":"10.04.2025","DataFact":"\/Date(1742248800000+0200)\/","DataFactAsString":"18.03.2025","Email":"alberto.burlacu93@gmail.com","Fact":16353031,"NrFact":21502789,"Numar":81,"Restplata":0.00,"Total_factura":86.19},{"Achitat":84.91,"AdrWeb":null,"CanDownload":true,"CodAbonat":27800,"Data":"\/Date(1744232400000+0300)\/","DataAsString":"10.04.2025","DataFact":"\/Date(1739829600000+0200)\/","DataFactAsString":"18.02.2025","Email":"alberto.burlacu93@gmail.com","Fact":16249534,"NrFact":21434181,"Numar":81,"Restplata":0.00,"Total_factura":84.91}]