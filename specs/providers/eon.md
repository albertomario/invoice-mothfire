## Requesting AUTH TOKEN
Request:
curl 'https://api2.eon.ro/users/v1/userauth/login' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://www.eon.ro/myline/login' \
  -H 'Content-Type: application/json' \
  -H 'Ocp-Apim-Subscription-Key: 674e9032df9d456fa371e17a4097a5b8' \
  -H 'Origin: https://www.eon.ro' \
  -H 'Connection: keep-alive' \
  -H 'Cookie: _cfuvid=z0mNGXARul6_UoWpcqHvHFoveIsiPUC2lvF2wsnLx1M-1762973556485-0.0.1.1-604800000; _gcl_au=1.1.1706187970.1762966749.1450046982.1762973564.1762973593; _ga_7QH3W3CMWZ=GS2.1.s1762973556$o2$g1$t1762973593$j59$l0$h0; _ga=GA1.2.1633800252.1762966749; _gid=GA1.2.1445837281.1762966749; _hjSessionUser_1090821=eyJpZCI6ImQ2Nzc4MzIxLTQzYmEtNTRjYi1iNzlhLTdiYjJhYjI2YTdhMCIsImNyZWF0ZWQiOjE3NjI5NjY3NDkyMDUsImV4aXN0aW5nIjp0cnVlfQ==; _tt_enable_cookie=1; _ttp=01K9WG3GJ3SD3NCXEC4PXFXJR9_.tt.1; ttcsid_C5T9KRTMTNIRP3MFGSJG=1762973556086::3OJ89SOU5jzL-sL5J5u6.2.1762973597858.0; ttcsid=1762973556085::H9s0bVO94aRILdsRnC-j.2.1762973597858.0; _clck=93qzse%5E2%5Eg0y%5E1%5E2142; ADRUM=s=1762973588372&r=https%3A%2F%2Fwww.eon.ro%2Fmyline%2Fdashboard; _gat_UA-33932014-19=1; __cf_bm=kjS0mahBX1AToEQVlDOr_ixEZmwvzJblpGal.Ki9RNM-1762973556-1.0.1.1-mSzCFTLwRi9rFmJdp2x6rPHuvcMM9PmmUTUaIuZJhWBQn6sjCCXcJQjZ6KpdbJY4ltU1YDptce5AYhsxTiR6_Scx4nliJgenLtuqlVj0sOg; _hjSession_1090821=eyJpZCI6IjhlZDlkZWI2LTdkYjItNDY1ZC04MTgxLTdmMjRjNjhiZDRmYiIsImMiOjE3NjI5NzM1NjAyMDMsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _clsk=ti2zxz%5E1762973582132%5E2%5E1%5Ee.clarity.ms%2Fcollect; _uetsid=e7e29d80bfe811f0ac8c3732fb8da980; _uetvid=e7e2abb0bfe811f08bb2031c4d51a90a' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'Priority: u=0' \
  --data-raw '{"username":"alberto.burlacu93@gmail.com","password":"Specials1967","rememberMe":false}'

Response:
{"accessToken":"9ede5a93-26ae-442f-8cc8-3da2f7d1769c","tokenType":"bearer","expiresIn":1799,"uuid":"aae96ee6-2194-4a49-860e-4a9ae98fce59","legacyId":"264403","scope":"*"}

## Listing latest unpaid invoices
Request:
curl 'https://api2.eon.ro/invoices/v1/invoices/list?accountContract=002202348574&status=unpaid' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://www.eon.ro/myline/facturile-mele' \
  -H 'Ocp-Apim-Subscription-Key: 674e9032df9d456fa371e17a4097a5b8' \
  -H 'Authorization: Bearer 9ede5a93-26ae-442f-8cc8-3da2f7d1769c' \
  -H 'Origin: https://www.eon.ro' \
  -H 'Connection: keep-alive' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site'

Response:
[{"fiscalNumber":"0000190017407730","maturityDate":"22.10.2025","emissionDate":"22.09.2025","disconnectionDate":null,"printDate":"17.09.2025","archiveDate":"17.09.2025","issuedValue":369.23,"balanceValue":369.23,"balanceValueDetail":null,"issuedValueDetail":null,"invoiceNumber":"011194504183","state":"1","type":"Consum","sector":"01","cb":"220234857422001900174077300010000036923","companyCode":"1930","electronic":true,"accountContract":"002202348574","hasDetails":true,"hasPdf":true,"isDownloadable":true,"canPay":false,"canActivate":false,"invoiceTypeCode":"FI","paymentInstalment":false,"meterDetails":null,"refund":false,"refundInProcess":false,"digitalInvoice":false,"refundRequestCreatedAt":null,"prosumId":null,"storno":null},{"fiscalNumber":"0000160020668595","maturityDate":"20.11.2025","emissionDate":"21.10.2025","disconnectionDate":null,"printDate":"17.10.2025","archiveDate":null,"issuedValue":317.79,"balanceValue":317.79,"balanceValueDetail":null,"issuedValueDetail":null,"invoiceNumber":"011895623139","state":"0","type":"Consum","sector":"01","cb":"220234857422001600206685950010000031779","companyCode":"1930","electronic":true,"accountContract":"002202348574","hasDetails":true,"hasPdf":true,"isDownloadable":true,"canPay":true,"canActivate":false,"invoiceTypeCode":"FI","paymentInstalment":false,"meterDetails":null,"refund":false,"refundInProcess":false,"digitalInvoice":false,"refundRequestCreatedAt":null,"prosumId":null,"storno":null}]


## Get account balance
Request:
curl 'https://api2.eon.ro/invoices/v1/invoices/invoice-balance?accountContract=002202348574' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://www.eon.ro/myline/facturile-mele' \
  -H 'Ocp-Apim-Subscription-Key: 674e9032df9d456fa371e17a4097a5b8' \
  -H 'Authorization: Bearer 9ede5a93-26ae-442f-8cc8-3da2f7d1769c' \
  -H 'Origin: https://www.eon.ro' \
  -H 'Connection: keep-alive' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site'

Response:
{"balance":317.79,"refund":false,"date":"12.11.2025","refundInProcess":false,"refundRequestCreatedAt":null,"hasGuarantee":false,"hasUnpaidGuarantee":false,"balancePay":true,"refundDocumentsRequired":false,"isAssociation":false}