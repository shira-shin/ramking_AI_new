function mustResolve(name){
  try { require.resolve(name); }
  catch(e){ 
    console.error(`[check-types] Missing dependency: ${name}. Add it to dependencies.`); 
    process.exit(1);
  }
}
mustResolve('@types/react');
mustResolve('typescript');
console.log('[check-types] OK');
