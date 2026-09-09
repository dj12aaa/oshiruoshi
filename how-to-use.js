(() => {
  'use strict';
  const input=document.getElementById('guideQuery'),status=document.getElementById('guideExampleStatus');
  if(!input)return;
  document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{
    input.value=button.dataset.example;
    status.textContent=`「${input.value}」を入力しました。「この言葉で検索」で結果を開けます。`;
  }));
})();
