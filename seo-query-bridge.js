(()=>{try{const value=new URLSearchParams(window.location.search).get('q');const input=document.getElementById('q');if(value&&input)input.value=String(value).trim().slice(0,120)}catch{}})();
