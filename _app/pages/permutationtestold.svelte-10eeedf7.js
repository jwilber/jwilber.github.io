import{S as Yl,i as Zl,s as Jl,e,k as l,t as n,M as Kl,c as s,a as i,m as c,h as o,d as a,N as Xl,b as r,K as ke,f as Nl,g as Br,G as t,n as Tr}from"../chunks/index-89a54c6d.js";function Ql(zl){let w,Ce,Ye,ae,Ze,ie,Je,Ke,re,Xe,le,Qe,dt,Ir,$e,ce,ts,ft,Pr,es,mt,Ar,je,P,U,tt,ss,bt,ns,os,vt,as,is,wt,rs,ls,x,cs,gt,hs,ps,yt,us,ds,et,fs,_t,ms,bs,vs,ws,gs,xt,ys,_s,xs,Q,Et,Rt,st,Es,g,M,Bt,Rs,Bs,u,Ts,nt,Is,Tt,Ps,As,Ss,qs,Ds,Ws,ks,Cs,It,js,Us,he,Hs,Vs,Ns,zs,Ms,Os,Fs,pe,Ls,Gs,ue,Ys,Zs,de,Js,Ks,Xs,Qs,$s,fe,tn,en,sn,nn,on,O,Pt,an,rn,E,ln,cn,hn,pn,me,un,dn,be,fn,mn,ve,bn,vn,wn,gn,yn,_n,F,At,xn,En,A,Rn,Bn,Tn,In,we,Pn,An,Sn,qn,Dn,St,Wn,kn,Cn,L,qt,jn,Un,d,Hn,Vn,Nn,zn,Dt,Mn,On,Fn,Ln,Gn,ot,Yn,Wt,Zn,Jn,Kn,Xn,Qn,ge,$n,to,ye,eo,so,_e,no,oo,ao,io,ro,lo,xe,co,ho,Ee,po,uo,fo,G,kt,mo,bo,R,vo,at,wo,Ct,go,yo,_o,xo,Eo,Ro,Bo,To,Io,Po,Ao,So,qo,Y,jt,Do,Wo,B,ko,Co,jo,Uo,Re,Ho,Vo,No,zo,Mo,Ut,Oo,Fo,Lo,Go,Yo,Z,Ht,Zo,Jo,T,Ko,Xo,Qo,$o,Be,ta,ea,it,sa,Vt,na,oa,aa,ia,ra,Nt,la,ca,ha,J,zt,pa,ua,I,da,Te,fa,ma,ba,va,wa,Mt,ga,ya,_a,xa,Ea,Ra,Ba,Ta,K,Ot,Ia,Pa,b,Aa,Ie,Sa,qa,Da,Wa,ka,Ca,ja,Ua,Ha,Va,Na,za,Ma,Oa,Fa,La,Ga,Ya,Za,Ja,Ka,Xa,Qa,$a,Ft,ti,h,Lt,ei,si,X,ni,oi,ai,ii,ri,li,ci,Gt,hi,pi,Yt,ui,di,Zt,fi,mi,bi,vi,S,wi,Pe,gi,yi,_i,xi,Ei,Ae,Ri,Bi,Ti,Ii,Pi,Ai,Si,qi,Di,Wi,ki,Ci,ji,Jt,Ui,Hi,Se,Vi,rt,Kt,Ni,zi,Mi,lt,Xt,Oi,Fi,Li,ct,Qt,Gi,Yi,Zi,Ji,Ki,Xi,$t,Qi,$i,qe,tr,ht,te,er,sr,nr,pt,ee,or,ar,ir,ut,se,rr,lr,cr,ne,Sr,hr,De,pr,ur,oe,qr;return{c(){w=e("head"),Ce=e("meta"),Ye=l(),ae=e("meta"),Ze=l(),ie=e("title"),Je=n("Permutation Test: Visual Explanation"),Ke=l(),re=e("meta"),Xe=l(),le=e("meta"),Qe=l(),dt=e("script"),$e=l(),ce=e("link"),ts=l(),ft=e("script"),es=l(),mt=e("script"),je=l(),P=e("body"),U=e("section"),tt=e("p"),ss=n("March 2019 By "),bt=e("a"),ns=n("Jared Wilber"),os=l(),vt=e("h1"),as=n("The Permutation Test"),is=l(),wt=e("p"),rs=n("A Visual Explanation of Statistical Testing"),ls=l(),x=e("p"),cs=n(`Statistical tests, also known as hypothesis tests, are used in the design of experiments to
			measure the effect of some treatment(s) on experimental units. They are employed in a large
			number of contexts: Oncologists use them to measure the efficacy of new treatment options for
			cancer. Google uses them to determine which color of blue (e.g. `),gt=e("span"),hs=n("this blue"),ps=n(`
			vs `),yt=e("span"),us=n("this blue"),ds=n(`) is most effective for outgoing links. And
			entomologists use them to study the sex habits of flies
			`),et=e("span"),fs=n("*"),_t=e("span"),ms=n("Proof that, yes, statistics is definitely very sexy"),bs=n(`.

			`),vs=e("br"),ws=e("br"),gs=n(`
			Unfortunately, a lot of statistical tests require complex assumptions and convoluted formula. This
			is especially true of those methods taught in introductory courses, giving the false impression
			that experimental design is boring and unintuitive. But fret not, my valued reader - not all tests
			are so bad! In what follows, I present a visual explanation for the
			`),xt=e("a"),ys=n("permutation test"),_s=n(`: an awesome nonparametric test that is light on assumptions,
			widely applicable, and very intuitive.`),xs=l(),Q=e("section"),Et=e("div"),Rt=e("div"),st=Kl("svg"),Es=l(),g=e("div"),M=e("div"),Bt=e("h2"),Rs=n("You're An Alpaca Shepherd Now"),Bs=l(),u=e("p"),Ts=n(`You've finally achieved your lifelong dream: you're an alpaca shepherd. And like any
					alpaca shepherd will tell you, your foremost concern is the wool quality of your herd.`),nt=e("span"),Is=n("*"),Tt=e("span"),Ps=n("this may or may not be true"),As=l(),Ss=e("br"),qs=e("br"),Ds=n(`
					Word on the street in Cusco is that a popular new shampoo increases the wool quality of your
					alpaca. But you're no sucker - you're going to find out for sure. You're going to test the
					difference with statistics.`),Ws=e("br"),ks=e("br"),Cs=n(`
					In statistical testing, we structure experiments in terms of
					`),It=e("a"),js=n("null & alternative"),Us=n(`
					hypotheses. Our test will have the following hypothesis schema`),he=e("b"),Hs=n(":"),Vs=l(),Ns=e("br"),zs=e("br"),Ms=l(),Os=e("br"),Fs=n(`
					\u0397`),pe=e("sub"),Ls=n("A"),Gs=n(": \u03BC"),ue=e("sub"),Ys=n("treatment"),Zs=n(" > \u03BC"),de=e("sub"),Js=n("control"),Ks=l(),Xs=e("br"),Qs=e("br"),$s=n(`
					Our null hypothesis claims that the new shampoo does `),fe=e("i"),tn=n("not"),en=n(` increase wool quality. The
					alternative hypothesis claims the opposite; new shampoo yields superior wool quality.
					`),sn=e("br"),nn=e("br"),on=l(),O=e("div"),Pt=e("h2"),an=n("Randomization"),rn=l(),E=e("p"),ln=n(`As a first step, we randomly assign half of our sampled alpaca to the new shampoo, and
					half to the old. `),cn=e("br"),hn=e("br"),pn=n(`
					We say that the alpaca receiving the new shampoo belong to the `),me=e("i"),un=n("treatment"),dn=n(` group, and
					the others to the `),be=e("i"),fn=n("control"),mn=n(` group. The assignment of an alpaca to a given diet is
					known as its `),ve=e("i"),bn=n("treatment assignment"),vn=n(`.
					`),wn=e("br"),gn=e("br"),yn=n(`
					Randomization of treatment assignment is very important. It removes bias and confunding from
					our results, and provides the basis for the theory underpinning our statistical test.`),_n=l(),F=e("div"),At=e("h2"),xn=n("Response Values"),En=l(),A=e("p"),Rn=n(`After giving each alpaca its designated shampoo, we determine if the new shampoo has any
					effect on wool quality.
					`),Bn=e("br"),Tn=e("br"),In=n(`
					In statistics jargon, every experimental unit has a `),we=e("i"),Pn=n("response"),An=n(` value. For us, each
					alpaca is an experimental unit, and its measure of wool quality after taking its shampoo
					is its response value.
					`),Sn=e("br"),qn=e("br"),Dn=n(`
					We can eyeball these values ourselves and get a feel for any perceived differences between
					the two shampoos. However, , we'll need a more rigourous method to determine if the differences
					are
					`),St=e("a"),Wn=n("statistically significant"),kn=n("."),Cn=l(),L=e("div"),qt=e("h2"),jn=n("Test Statistic"),Un=l(),d=e("p"),Hn=n(`To determine whether or not the new shampoo really is effective, we need a way to quantify
					the difference between our null and alternative hypotheses.
					`),Vn=e("br"),Nn=e("br"),zn=n(`
					Luckily for us, such a numerical summary exists: the
					`),Dt=e("a"),Mn=n("test statistic"),On=n(`.
					`),Fn=e("br"),Ln=e("br"),Gn=n(`
					A benefit of the permutation test is that it allows us to use any numerical value that we want
					for our test statistic.`),ot=e("span"),Yn=n("*"),Wt=e("span"),Zn=n("many other tests require complex, specificc test statistics"),Jn=n(`
					Because our analysis is fairly straightforward, we'll simply use the difference in mean response
					values between the two shampoos:
					`),Kn=e("br"),Xn=e("br"),Qn=l(),ge=e("i"),$n=n("Test Statistic"),to=n(" = \u03BC"),ye=e("sub"),eo=n("Treatment"),so=n(" - \u03BC"),_e=e("sub"),no=n("Control"),oo=l(),ao=e("br"),io=l(),ro=e("br"),lo=n(`
					To obtain our initial test statistic, we simply subtract the mean wool quality of the alpacas
					that used the new shampoo (`),xe=e("i"),co=n("treatment group"),ho=n(`) from the mean wool quality of the
					alpacas that did not use the new shampoo (`),Ee=e("i"),po=n("control group"),uo=n(")."),fo=l(),G=e("div"),kt=e("h2"),mo=n("The 'P' in 'Permutation'"),bo=l(),R=e("p"),vo=n("Enter the most important step of the permutation test, as well as its namesake."),at=e("span"),wo=n("*"),Ct=e("span"),go=n("It's also called the 'randomization test'"),yo=l(),_o=e("br"),xo=e("br"),Eo=n(`
					While keeping the same response values we received earlier, we permute (shuffle) the treatment
					assignments of our alpaca, and re-calculate our test statistic.
					`),Ro=e("br"),Bo=e("br"),To=n(`
					We do this because we analyze the results of our experiment relative to the null hypothesis,
					which posits the new shampoo as having no benefit on wool quality.
					`),Io=e("br"),Po=e("br"),Ao=n(`
					While this may seem a bit odd, the logic is quite simple: if the new shampoo truly doesn't
					improve wool quality, shuffling the shampoo label of our alpaca and recalculating our test
					statistic won't matter - we'll obtain similar wool quality values for both groups.
					`),So=e("br"),qo=l(),Y=e("div"),jt=e("h2"),Do=n("More Permutations"),Wo=l(),B=e("p"),ko=n(`We repeat this process, permuting our data over and over again, and recalculate a test
					statistic at each iteration.
					`),Co=e("br"),jo=e("br"),Uo=n(`
					Ideally, we'd calculate a test statistic for `),Re=e("i"),Ho=n("every"),Vo=n(` possible permutation of shampoo
					assignment among our alpaca. This would create an exact distribution of all possible test
					statistics under our null hypothesis.
					`),No=e("br"),zo=e("br"),Mo=n(`
					Unfortunatley, calculating every permutation is often
					`),Ut=e("a"),Oo=n("far too large"),Fo=n(`
					for practicality. No worries! Instead we'll resample enough permutations to build an approximation
					to our distribution, as that'll work just as well.
					`),Lo=e("br"),Go=e("br"),Yo=l(),Z=e("div"),Ht=e("h2"),Zo=n("Test Statistic Distribution"),Jo=l(),T=e("p"),Ko=n(`Eventually, after some sufficient number of permutations, we create the approximate test
					statistic distribution.
					`),Xo=e("br"),Qo=e("br"),$o=n(`
					This distribution approximates all possible test statistic values we could have seen
					`),Be=e("i"),ta=n("under the null hypothesis"),ea=n(`. We can then use this distribution to obtain
					probabilities associated with different mean-difference values`),it=e("span"),sa=n("*"),Vt=e("span"),na=n("Or whatever calculation you used for your test statistic"),oa=n(`
					, where we assume that wool quality does not increase with the new shampoo.
					`),aa=e("br"),ia=e("br"),ra=n(`
					By observing where our initial test statistic falls within this distribution, we obtain the
					final piece for our test: The magical `),Nt=e("a"),la=n("p-value"),ca=n("."),ha=l(),J=e("div"),zt=e("h2"),pa=n("The P-Value"),ua=l(),I=e("p"),da=n(`A p-value represents the probability of obtaining the observed values, assuming the null
					hypothesis is true. For us, it's the probability of obtaining the differences in wool
					quality we did, `),Te=e("i"),fa=n("assuming the new shampoo did not increase wool quality"),ma=n(`.
					`),ba=e("br"),va=e("br"),wa=n(`
					To determine the outcome of our test, we compare our p-value to a
					`),Mt=e("a"),ga=n("significance level"),ya=n(`.
					This should be determined a prioir, but we'll just say ours is 10%. If the p-value is less
					than or equal to the significance level, we reject the null hypothesis; the outcome is
					said to be statistically significant.
					`),_a=e("br"),xa=e("br"),Ea=n(`
					For us, a low p-value signals that, assuming the null hypothesis is true, the probability of
					obtaining our initial differences in wool quality occurs with a low probability. A high p-value
					signals the opposite, such an outcome is likely under the null hypothesis.
					`),Ra=e("br"),Ba=e("br"),Ta=l(),K=e("div"),Ot=e("h2"),Ia=n("Our Results"),Pa=l(),b=e("p"),Aa=n(`To calculate the p-value for a permutation test, we simply count the number of
					test-statistics `),Ie=e("i"),Sa=n("as or more extreme"),qa=n(` than our initial test statistic, and divide
					that number by the total number of test-statistics we calculated.
					`),Da=e("br"),Wa=e("br"),ka=n(`
					In our case, only sixteen out of our two-hundred test statistics were as or more extreme than
					our initial test statistic.
					`),Ca=e("br"),ja=e("br"),Ua=n(` Thus, our p-value is:
					`),Ha=e("br"),Va=e("br"),Na=n(` P-Value = 16 / 200
					`),za=e("br"),Ma=e("br"),Oa=n(` \xA0\xA0\xA0\xA0= 0.08
					`),Fa=e("br"),La=e("br"),Ga=n(` \xA0\xA0\xA0\xA0= 8%
					`),Ya=e("br"),Za=e("br"),Ja=n(`
					In other words, if it's truly the case that the new shampoo doesn't improve wool quality, then
					obtaining the initial difference in wool quality we did occurs with a probability of only 8%.
					`),Ka=e("br"),Xa=e("br"),Qa=n(`That's a fairly low probability. In fact, at our 10% level of significance, we
					reject our null hypothesis and accept our alternative: the new shampoo does appear to be
					increasing wool quality. Time to buy some more!`),$a=l(),Ft=e("div"),ti=l(),h=e("section"),Lt=e("h2"),ei=n("Conclusion"),si=l(),X=e("p"),ni=n(`So that's the permutation test, or at least my attempt at explaining it. Pretty cool. Pretty
			simple. And, hopefully, pretty intuitive.

			`),oi=e("br"),ai=e("br"),ii=n(`
			To recap, the algorithm comprises three steps:`),ri=l(),li=e("br"),ci=l(),Gt=e("p"),hi=n("1). Determine & calculate the initial test-statistic."),pi=l(),Yt=e("p"),ui=n("2). Construct approximate test-statistic distribution."),di=l(),Zt=e("p"),fi=n("3). Calculate the p-value."),mi=l(),bi=e("br"),vi=l(),S=e("p"),wi=n("This was not an "),Pe=e("i"),gi=n("exhaustive"),yi=n(` treatment of the statistical testing, some things were left
			out. But I hope it was helpful in explaining the permutation test, and, more broadly, for
			communicating that statistical testing involves more than just memorizing formulae.
			`),_i=e("br"),xi=e("br"),Ei=n(`
			In any case, I just hope that at some point you found yourself muttering aloud to yourself, "Woah,
			statistics `),Ae=e("i"),Ri=n("is"),Bi=n(` kind of cool." To which I'd respond yes, anonymous reader - you're damn
			right it is.
			`),Ti=e("br"),Ii=e("br"),Pi=l(),Ai=e("br"),Si=e("br"),qi=e("br"),Di=l(),Wi=e("hr"),ki=l(),Ci=e("br"),ji=l(),Jt=e("h2"),Ui=n("References"),Hi=l(),Se=e("p"),Vi=l(),rt=e("p"),Kt=e("a"),Ni=n("Introduction to Design and Analysis of Experiments"),zi=n(" (George W. Cobb, 1998)"),Mi=l(),lt=e("p"),Xt=e("a"),Oi=n("There is only one test!"),Fi=n(" (Allen Downey, 2011)"),Li=l(),ct=e("p"),Qt=e("a"),Gi=n("Permutation Tests"),Yi=n(" (Thomas Leeper, 2013)"),Zi=l(),Ji=e("br"),Ki=e("br"),Xi=l(),$t=e("h2"),Qi=n("Resources"),$i=l(),qe=e("p"),tr=l(),ht=e("p"),te=e("a"),er=n("D3.js"),sr=n(" (Mike Bostock)"),nr=l(),pt=e("p"),ee=e("a"),or=n("Rough.js"),ar=n(" (Preet Shihn)"),ir=l(),ut=e("p"),se=e("a"),rr=n("scrollama.js"),lr=n(" (Russel Goldenberg)"),cr=l(),ne=e("script"),hr=l(),De=e("script"),pr=n(`// seet seed so numbers are always the same
		Math.seedrandom('seed');

		var container = d3.select('#scroll');
		var graphic = container.select('.scroll__graphic');
		var chart = graphic.select('.chart');
		var text = container.select('.scroll__text');
		var step = text.selectAll('.step');

		var scroller = scrollama();

		// generic window resize listener event
		function handleResize() {
			// 1. update height of step elements
			var stepHeight = Math.floor(window.innerHeight * 0.9); // was * .75
			step.style('height', stepHeight + 'px');
			// 2. update width/height of graphic element
			var bodyWidth = d3.select('body').node().offsetWidth;
			graphic.style('width', bodyWidth + 'px').style('height', window.innerHeight + 'px');
			var chartMargin = bodyWidth > 350 ? 32 : 10;
			var textWidth = text.node().offsetWidth;
			var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
			console.log('chartwidth:', chartWidth);
			chart
				.style('width', chartWidth + 'px')
				.style('height', Math.floor(window.innerHeight / 1.2) + 'px');
			// 3. tell scrollama to update new element dimensions
			scroller.resize();
		}

		// scrollama event handlers
		function handleStepEnter(response) {
			// add color to current step only
			step.classed('is-active', function (d, i) {
				return i === response.index;
			});

			// console.log('response index:' + response.index)

			if ((response.index == 0) & (response.direction == 'down')) {
				console.log('0 down');
				transitionZeroDown();
			} else if ((response.index == 0) & (response.direction == 'up')) {
				console.log('0 up');
				transitionZeroUp();
			} else if ((response.index == 1) & (response.direction == 'down')) {
				console.log('1 down');
				transitionOneDown();
			} else if ((response.index == 1) & (response.direction == 'up')) {
				console.log('1 up');
				transitionOneUp();
			} else if ((response.index == 2) & (response.direction == 'up')) {
				console.log('2 up');
				transitionTwoUp();
			} else if ((response.index == 2) & (response.direction == 'down')) {
				console.log('2 down');
				transitionTwoDown();
			} else if ((response.index == 3) & (response.direction == 'up')) {
				console.log('3 up');
				transitionThreeUp();
				moveNodes();
			} else if ((response.index == 3) & (response.direction == 'down')) {
				console.log('3 down');
				transitionThreeDown();
			} else if ((response.index == 4) & (response.direction == 'up')) {
				console.log('4 up');
				transitionFourUp();
			} else if ((response.index == 4) & (response.direction == 'down')) {
				console.log('4 down');
				transitionFourDown();
			} else if ((response.index == 5) & (response.direction == 'up')) {
				console.log('5 up');
				transitionFiveUp();
			} else if ((response.index == 5) & (response.direction == 'down')) {
				console.log('5 down');
				transitionFiveDown();
			} else if ((response.index == 6) & (response.direction == 'up')) {
				console.log('6 up');
				transitionSixUp();
			} else if ((response.index == 6) & (response.direction == 'down')) {
				console.log('6 down');
				transitionSixDown();
			} else if ((response.index == 7) & (response.direction == 'up')) {
				console.log('7 up');
				transitionSevenUp();
			} else if ((response.index == 7) & (response.direction == 'down')) {
				console.log('7 down');
				transitionSevenDown();
			} else if ((response.index == 8) & (response.direction == 'up')) {
				console.log('8 up');
				transitionEightUp();
			} else if ((response.index == 8) & (response.direction == 'down')) {
				console.log('8 down');
				transitionEightDown();
			} else {
				console.log('else case, response index: ', response.index);
			}
		}

		function handleContainerEnter(response) {
			graphic.classed('is-fixed', true);
			graphic.classed('is-bottom', false);
		}
		function handleContainerExit(response) {
			graphic.classed('is-fixed', false);
			graphic.classed('is-bottom', response.direction === 'down');
			if (response.direction === 'down') {
				transitionExit();
			}
		}

		function init() {
			handleResize();
			scroller
				.setup({
					container: '#scroll',
					graphic: '.scroll__graphic',
					text: '.scroll__text',
					step: '.scroll__text .step',
					debug: false
				})
				.onStepEnter(handleStepEnter)
				.onContainerEnter(handleContainerEnter)
				.onContainerExit(handleContainerExit);
			window.addEventListener('resize', handleResize);
		}
		init();`),ur=l(),oe=e("script"),this.h()},l(N){w=s(N,"HEAD",{});var y=i(w);Ce=s(y,"META",{charset:!0}),Ye=c(y),ae=s(y,"META",{"http-equiv":!0,content:!0}),Ze=c(y),ie=s(y,"TITLE",{});var Dr=i(ie);Je=o(Dr,"Permutation Test: Visual Explanation"),Dr.forEach(a),Ke=c(y),re=s(y,"META",{name:!0,content:!0}),Xe=c(y),le=s(y,"META",{name:!0,content:!0}),Qe=c(y),dt=s(y,"SCRIPT",{src:!0});var Ml=i(dt);Ml.forEach(a),$e=c(y),ce=s(y,"LINK",{rel:!0,href:!0}),ts=c(y),ft=s(y,"SCRIPT",{src:!0});var Ol=i(ft);Ol.forEach(a),es=c(y),mt=s(y,"SCRIPT",{src:!0});var Fl=i(mt);Fl.forEach(a),y.forEach(a),je=c(N),P=s(N,"BODY",{});var H=i(P);U=s(H,"SECTION",{id:!0});var $=i(U);tt=s($,"P",{class:!0});var dr=i(tt);ss=o(dr,"March 2019 By "),bt=s(dr,"A",{href:!0});var Wr=i(bt);ns=o(Wr,"Jared Wilber"),Wr.forEach(a),dr.forEach(a),os=c($),vt=s($,"H1",{class:!0});var kr=i(vt);as=o(kr,"The Permutation Test"),kr.forEach(a),is=c($),wt=s($,"P",{class:!0});var Cr=i(wt);rs=o(Cr,"A Visual Explanation of Statistical Testing"),Cr.forEach(a),ls=c($),x=s($,"P",{class:!0});var j=i(x);cs=o(j,`Statistical tests, also known as hypothesis tests, are used in the design of experiments to
			measure the effect of some treatment(s) on experimental units. They are employed in a large
			number of contexts: Oncologists use them to measure the efficacy of new treatment options for
			cancer. Google uses them to determine which color of blue (e.g. `),gt=s(j,"SPAN",{class:!0});var jr=i(gt);hs=o(jr,"this blue"),jr.forEach(a),ps=o(j,`
			vs `),yt=s(j,"SPAN",{class:!0});var Ur=i(yt);us=o(Ur,"this blue"),Ur.forEach(a),ds=o(j,`) is most effective for outgoing links. And
			entomologists use them to study the sex habits of flies
			`),et=s(j,"SPAN",{class:!0});var fr=i(et);fs=o(fr,"*"),_t=s(fr,"SPAN",{class:!0});var Hr=i(_t);ms=o(Hr,"Proof that, yes, statistics is definitely very sexy"),Hr.forEach(a),fr.forEach(a),bs=o(j,`.

			`),vs=s(j,"BR",{}),ws=s(j,"BR",{}),gs=o(j,`
			Unfortunately, a lot of statistical tests require complex assumptions and convoluted formula. This
			is especially true of those methods taught in introductory courses, giving the false impression
			that experimental design is boring and unintuitive. But fret not, my valued reader - not all tests
			are so bad! In what follows, I present a visual explanation for the
			`),xt=s(j,"A",{href:!0});var Vr=i(xt);ys=o(Vr,"permutation test"),Vr.forEach(a),_s=o(j,`: an awesome nonparametric test that is light on assumptions,
			widely applicable, and very intuitive.`),j.forEach(a),$.forEach(a),xs=c(H),Q=s(H,"SECTION",{id:!0});var Ue=i(Q);Et=s(Ue,"DIV",{class:!0});var Nr=i(Et);Rt=s(Nr,"DIV",{class:!0});var zr=i(Rt);st=Xl(zr,"svg",{id:!0,style:!0}),i(st).forEach(a),zr.forEach(a),Nr.forEach(a),Es=c(Ue),g=s(Ue,"DIV",{class:!0});var _=i(g);M=s(_,"DIV",{class:!0,"data-step":!0});var He=i(M);Bt=s(He,"H2",{class:!0});var Mr=i(Bt);Rs=o(Mr,"You're An Alpaca Shepherd Now"),Mr.forEach(a),Bs=c(He),u=s(He,"P",{});var f=i(u);Ts=o(f,`You've finally achieved your lifelong dream: you're an alpaca shepherd. And like any
					alpaca shepherd will tell you, your foremost concern is the wool quality of your herd.`),nt=s(f,"SPAN",{class:!0});var mr=i(nt);Is=o(mr,"*"),Tt=s(mr,"SPAN",{class:!0});var Or=i(Tt);Ps=o(Or,"this may or may not be true"),Or.forEach(a),mr.forEach(a),As=c(f),Ss=s(f,"BR",{}),qs=s(f,"BR",{}),Ds=o(f,`
					Word on the street in Cusco is that a popular new shampoo increases the wool quality of your
					alpaca. But you're no sucker - you're going to find out for sure. You're going to test the
					difference with statistics.`),Ws=s(f,"BR",{}),ks=s(f,"BR",{}),Cs=o(f,`
					In statistical testing, we structure experiments in terms of
					`),It=s(f,"A",{href:!0});var Fr=i(It);js=o(Fr,"null & alternative"),Fr.forEach(a),Us=o(f,`
					hypotheses. Our test will have the following hypothesis schema`),he=s(f,"B",{});var Lr=i(he);Hs=o(Lr,":"),Lr.forEach(a),Vs=c(f),Ns=s(f,"BR",{}),zs=s(f,"BR",{}),Ms=c(f),Os=s(f,"BR",{}),Fs=o(f,`
					\u0397`),pe=s(f,"SUB",{});var Gr=i(pe);Ls=o(Gr,"A"),Gr.forEach(a),Gs=o(f,": \u03BC"),ue=s(f,"SUB",{});var Yr=i(ue);Ys=o(Yr,"treatment"),Yr.forEach(a),Zs=o(f," > \u03BC"),de=s(f,"SUB",{});var Zr=i(de);Js=o(Zr,"control"),Zr.forEach(a),Ks=c(f),Xs=s(f,"BR",{}),Qs=s(f,"BR",{}),$s=o(f,`
					Our null hypothesis claims that the new shampoo does `),fe=s(f,"I",{});var Jr=i(fe);tn=o(Jr,"not"),Jr.forEach(a),en=o(f,` increase wool quality. The
					alternative hypothesis claims the opposite; new shampoo yields superior wool quality.
					`),sn=s(f,"BR",{}),nn=s(f,"BR",{}),f.forEach(a),He.forEach(a),on=c(_),O=s(_,"DIV",{class:!0,"data-step":!0});var Ve=i(O);Pt=s(Ve,"H2",{class:!0});var Kr=i(Pt);an=o(Kr,"Randomization"),Kr.forEach(a),rn=c(Ve),E=s(Ve,"P",{});var q=i(E);ln=o(q,`As a first step, we randomly assign half of our sampled alpaca to the new shampoo, and
					half to the old. `),cn=s(q,"BR",{}),hn=s(q,"BR",{}),pn=o(q,`
					We say that the alpaca receiving the new shampoo belong to the `),me=s(q,"I",{});var Xr=i(me);un=o(Xr,"treatment"),Xr.forEach(a),dn=o(q,` group, and
					the others to the `),be=s(q,"I",{});var Qr=i(be);fn=o(Qr,"control"),Qr.forEach(a),mn=o(q,` group. The assignment of an alpaca to a given diet is
					known as its `),ve=s(q,"I",{});var $r=i(ve);bn=o($r,"treatment assignment"),$r.forEach(a),vn=o(q,`.
					`),wn=s(q,"BR",{}),gn=s(q,"BR",{}),yn=o(q,`
					Randomization of treatment assignment is very important. It removes bias and confunding from
					our results, and provides the basis for the theory underpinning our statistical test.`),q.forEach(a),Ve.forEach(a),_n=c(_),F=s(_,"DIV",{class:!0,"data-step":!0});var Ne=i(F);At=s(Ne,"H2",{class:!0});var tl=i(At);xn=o(tl,"Response Values"),tl.forEach(a),En=c(Ne),A=s(Ne,"P",{});var V=i(A);Rn=o(V,`After giving each alpaca its designated shampoo, we determine if the new shampoo has any
					effect on wool quality.
					`),Bn=s(V,"BR",{}),Tn=s(V,"BR",{}),In=o(V,`
					In statistics jargon, every experimental unit has a `),we=s(V,"I",{});var el=i(we);Pn=o(el,"response"),el.forEach(a),An=o(V,` value. For us, each
					alpaca is an experimental unit, and its measure of wool quality after taking its shampoo
					is its response value.
					`),Sn=s(V,"BR",{}),qn=s(V,"BR",{}),Dn=o(V,`
					We can eyeball these values ourselves and get a feel for any perceived differences between
					the two shampoos. However, , we'll need a more rigourous method to determine if the differences
					are
					`),St=s(V,"A",{href:!0});var sl=i(St);Wn=o(sl,"statistically significant"),sl.forEach(a),kn=o(V,"."),V.forEach(a),Ne.forEach(a),Cn=c(_),L=s(_,"DIV",{class:!0,"data-step":!0});var ze=i(L);qt=s(ze,"H2",{class:!0});var nl=i(qt);jn=o(nl,"Test Statistic"),nl.forEach(a),Un=c(ze),d=s(ze,"P",{});var m=i(d);Hn=o(m,`To determine whether or not the new shampoo really is effective, we need a way to quantify
					the difference between our null and alternative hypotheses.
					`),Vn=s(m,"BR",{}),Nn=s(m,"BR",{}),zn=o(m,`
					Luckily for us, such a numerical summary exists: the
					`),Dt=s(m,"A",{href:!0});var ol=i(Dt);Mn=o(ol,"test statistic"),ol.forEach(a),On=o(m,`.
					`),Fn=s(m,"BR",{}),Ln=s(m,"BR",{}),Gn=o(m,`
					A benefit of the permutation test is that it allows us to use any numerical value that we want
					for our test statistic.`),ot=s(m,"SPAN",{class:!0});var br=i(ot);Yn=o(br,"*"),Wt=s(br,"SPAN",{class:!0});var al=i(Wt);Zn=o(al,"many other tests require complex, specificc test statistics"),al.forEach(a),br.forEach(a),Jn=o(m,`
					Because our analysis is fairly straightforward, we'll simply use the difference in mean response
					values between the two shampoos:
					`),Kn=s(m,"BR",{}),Xn=s(m,"BR",{}),Qn=c(m),ge=s(m,"I",{});var il=i(ge);$n=o(il,"Test Statistic"),il.forEach(a),to=o(m," = \u03BC"),ye=s(m,"SUB",{});var rl=i(ye);eo=o(rl,"Treatment"),rl.forEach(a),so=o(m," - \u03BC"),_e=s(m,"SUB",{});var ll=i(_e);no=o(ll,"Control"),ll.forEach(a),oo=c(m),ao=s(m,"BR",{}),io=c(m),ro=s(m,"BR",{}),lo=o(m,`
					To obtain our initial test statistic, we simply subtract the mean wool quality of the alpacas
					that used the new shampoo (`),xe=s(m,"I",{});var cl=i(xe);co=o(cl,"treatment group"),cl.forEach(a),ho=o(m,`) from the mean wool quality of the
					alpacas that did not use the new shampoo (`),Ee=s(m,"I",{});var hl=i(Ee);po=o(hl,"control group"),hl.forEach(a),uo=o(m,")."),m.forEach(a),ze.forEach(a),fo=c(_),G=s(_,"DIV",{class:!0,"data-step":!0});var Me=i(G);kt=s(Me,"H2",{class:!0});var pl=i(kt);mo=o(pl,"The 'P' in 'Permutation'"),pl.forEach(a),bo=c(Me),R=s(Me,"P",{});var D=i(R);vo=o(D,"Enter the most important step of the permutation test, as well as its namesake."),at=s(D,"SPAN",{class:!0});var vr=i(at);wo=o(vr,"*"),Ct=s(vr,"SPAN",{class:!0});var ul=i(Ct);go=o(ul,"It's also called the 'randomization test'"),ul.forEach(a),vr.forEach(a),yo=c(D),_o=s(D,"BR",{}),xo=s(D,"BR",{}),Eo=o(D,`
					While keeping the same response values we received earlier, we permute (shuffle) the treatment
					assignments of our alpaca, and re-calculate our test statistic.
					`),Ro=s(D,"BR",{}),Bo=s(D,"BR",{}),To=o(D,`
					We do this because we analyze the results of our experiment relative to the null hypothesis,
					which posits the new shampoo as having no benefit on wool quality.
					`),Io=s(D,"BR",{}),Po=s(D,"BR",{}),Ao=o(D,`
					While this may seem a bit odd, the logic is quite simple: if the new shampoo truly doesn't
					improve wool quality, shuffling the shampoo label of our alpaca and recalculating our test
					statistic won't matter - we'll obtain similar wool quality values for both groups.
					`),So=s(D,"BR",{}),D.forEach(a),Me.forEach(a),qo=c(_),Y=s(_,"DIV",{class:!0,"data-step":!0});var Oe=i(Y);jt=s(Oe,"H2",{class:!0});var dl=i(jt);Do=o(dl,"More Permutations"),dl.forEach(a),Wo=c(Oe),B=s(Oe,"P",{});var W=i(B);ko=o(W,`We repeat this process, permuting our data over and over again, and recalculate a test
					statistic at each iteration.
					`),Co=s(W,"BR",{}),jo=s(W,"BR",{}),Uo=o(W,`
					Ideally, we'd calculate a test statistic for `),Re=s(W,"I",{});var fl=i(Re);Ho=o(fl,"every"),fl.forEach(a),Vo=o(W,` possible permutation of shampoo
					assignment among our alpaca. This would create an exact distribution of all possible test
					statistics under our null hypothesis.
					`),No=s(W,"BR",{}),zo=s(W,"BR",{}),Mo=o(W,`
					Unfortunatley, calculating every permutation is often
					`),Ut=s(W,"A",{href:!0});var ml=i(Ut);Oo=o(ml,"far too large"),ml.forEach(a),Fo=o(W,`
					for practicality. No worries! Instead we'll resample enough permutations to build an approximation
					to our distribution, as that'll work just as well.
					`),Lo=s(W,"BR",{}),Go=s(W,"BR",{}),W.forEach(a),Oe.forEach(a),Yo=c(_),Z=s(_,"DIV",{class:!0,"data-step":!0});var Fe=i(Z);Ht=s(Fe,"H2",{class:!0});var bl=i(Ht);Zo=o(bl,"Test Statistic Distribution"),bl.forEach(a),Jo=c(Fe),T=s(Fe,"P",{});var k=i(T);Ko=o(k,`Eventually, after some sufficient number of permutations, we create the approximate test
					statistic distribution.
					`),Xo=s(k,"BR",{}),Qo=s(k,"BR",{}),$o=o(k,`
					This distribution approximates all possible test statistic values we could have seen
					`),Be=s(k,"I",{});var vl=i(Be);ta=o(vl,"under the null hypothesis"),vl.forEach(a),ea=o(k,`. We can then use this distribution to obtain
					probabilities associated with different mean-difference values`),it=s(k,"SPAN",{class:!0});var wr=i(it);sa=o(wr,"*"),Vt=s(wr,"SPAN",{class:!0});var wl=i(Vt);na=o(wl,"Or whatever calculation you used for your test statistic"),wl.forEach(a),wr.forEach(a),oa=o(k,`
					, where we assume that wool quality does not increase with the new shampoo.
					`),aa=s(k,"BR",{}),ia=s(k,"BR",{}),ra=o(k,`
					By observing where our initial test statistic falls within this distribution, we obtain the
					final piece for our test: The magical `),Nt=s(k,"A",{href:!0});var gl=i(Nt);la=o(gl,"p-value"),gl.forEach(a),ca=o(k,"."),k.forEach(a),Fe.forEach(a),ha=c(_),J=s(_,"DIV",{class:!0,"data-step":!0});var Le=i(J);zt=s(Le,"H2",{class:!0});var yl=i(zt);pa=o(yl,"The P-Value"),yl.forEach(a),ua=c(Le),I=s(Le,"P",{});var C=i(I);da=o(C,`A p-value represents the probability of obtaining the observed values, assuming the null
					hypothesis is true. For us, it's the probability of obtaining the differences in wool
					quality we did, `),Te=s(C,"I",{});var _l=i(Te);fa=o(_l,"assuming the new shampoo did not increase wool quality"),_l.forEach(a),ma=o(C,`.
					`),ba=s(C,"BR",{}),va=s(C,"BR",{}),wa=o(C,`
					To determine the outcome of our test, we compare our p-value to a
					`),Mt=s(C,"A",{href:!0});var xl=i(Mt);ga=o(xl,"significance level"),xl.forEach(a),ya=o(C,`.
					This should be determined a prioir, but we'll just say ours is 10%. If the p-value is less
					than or equal to the significance level, we reject the null hypothesis; the outcome is
					said to be statistically significant.
					`),_a=s(C,"BR",{}),xa=s(C,"BR",{}),Ea=o(C,`
					For us, a low p-value signals that, assuming the null hypothesis is true, the probability of
					obtaining our initial differences in wool quality occurs with a low probability. A high p-value
					signals the opposite, such an outcome is likely under the null hypothesis.
					`),Ra=s(C,"BR",{}),Ba=s(C,"BR",{}),C.forEach(a),Le.forEach(a),Ta=c(_),K=s(_,"DIV",{class:!0,"data-step":!0});var Ge=i(K);Ot=s(Ge,"H2",{class:!0});var El=i(Ot);Ia=o(El,"Our Results"),El.forEach(a),Pa=c(Ge),b=s(Ge,"P",{});var v=i(b);Aa=o(v,`To calculate the p-value for a permutation test, we simply count the number of
					test-statistics `),Ie=s(v,"I",{});var Rl=i(Ie);Sa=o(Rl,"as or more extreme"),Rl.forEach(a),qa=o(v,` than our initial test statistic, and divide
					that number by the total number of test-statistics we calculated.
					`),Da=s(v,"BR",{}),Wa=s(v,"BR",{}),ka=o(v,`
					In our case, only sixteen out of our two-hundred test statistics were as or more extreme than
					our initial test statistic.
					`),Ca=s(v,"BR",{}),ja=s(v,"BR",{}),Ua=o(v,` Thus, our p-value is:
					`),Ha=s(v,"BR",{}),Va=s(v,"BR",{}),Na=o(v,` P-Value = 16 / 200
					`),za=s(v,"BR",{}),Ma=s(v,"BR",{}),Oa=o(v,` \xA0\xA0\xA0\xA0= 0.08
					`),Fa=s(v,"BR",{}),La=s(v,"BR",{}),Ga=o(v,` \xA0\xA0\xA0\xA0= 8%
					`),Ya=s(v,"BR",{}),Za=s(v,"BR",{}),Ja=o(v,`
					In other words, if it's truly the case that the new shampoo doesn't improve wool quality, then
					obtaining the initial difference in wool quality we did occurs with a probability of only 8%.
					`),Ka=s(v,"BR",{}),Xa=s(v,"BR",{}),Qa=o(v,`That's a fairly low probability. In fact, at our 10% level of significance, we
					reject our null hypothesis and accept our alternative: the new shampoo does appear to be
					increasing wool quality. Time to buy some more!`),v.forEach(a),Ge.forEach(a),$a=c(_),Ft=s(_,"DIV",{class:!0,"data-step":!0}),i(Ft).forEach(a),_.forEach(a),Ue.forEach(a),ti=c(H),h=s(H,"SECTION",{id:!0});var p=i(h);Lt=s(p,"H2",{class:!0});var Bl=i(Lt);ei=o(Bl,"Conclusion"),Bl.forEach(a),si=c(p),X=s(p,"P",{class:!0});var We=i(X);ni=o(We,`So that's the permutation test, or at least my attempt at explaining it. Pretty cool. Pretty
			simple. And, hopefully, pretty intuitive.

			`),oi=s(We,"BR",{}),ai=s(We,"BR",{}),ii=o(We,`
			To recap, the algorithm comprises three steps:`),We.forEach(a),ri=c(p),li=s(p,"BR",{}),ci=c(p),Gt=s(p,"P",{class:!0});var Tl=i(Gt);hi=o(Tl,"1). Determine & calculate the initial test-statistic."),Tl.forEach(a),pi=c(p),Yt=s(p,"P",{class:!0});var Il=i(Yt);ui=o(Il,"2). Construct approximate test-statistic distribution."),Il.forEach(a),di=c(p),Zt=s(p,"P",{class:!0});var Pl=i(Zt);fi=o(Pl,"3). Calculate the p-value."),Pl.forEach(a),mi=c(p),bi=s(p,"BR",{}),vi=c(p),S=s(p,"P",{class:!0});var z=i(S);wi=o(z,"This was not an "),Pe=s(z,"I",{});var Al=i(Pe);gi=o(Al,"exhaustive"),Al.forEach(a),yi=o(z,` treatment of the statistical testing, some things were left
			out. But I hope it was helpful in explaining the permutation test, and, more broadly, for
			communicating that statistical testing involves more than just memorizing formulae.
			`),_i=s(z,"BR",{}),xi=s(z,"BR",{}),Ei=o(z,`
			In any case, I just hope that at some point you found yourself muttering aloud to yourself, "Woah,
			statistics `),Ae=s(z,"I",{});var Sl=i(Ae);Ri=o(Sl,"is"),Sl.forEach(a),Bi=o(z,` kind of cool." To which I'd respond yes, anonymous reader - you're damn
			right it is.
			`),Ti=s(z,"BR",{}),Ii=s(z,"BR",{}),z.forEach(a),Pi=c(p),Ai=s(p,"BR",{}),Si=s(p,"BR",{}),qi=s(p,"BR",{}),Di=c(p),Wi=s(p,"HR",{}),ki=c(p),Ci=s(p,"BR",{}),ji=c(p),Jt=s(p,"H2",{class:!0});var ql=i(Jt);Ui=o(ql,"References"),ql.forEach(a),Hi=c(p),Se=s(p,"P",{class:!0}),i(Se).forEach(a),Vi=c(p),rt=s(p,"P",{class:!0});var gr=i(rt);Kt=s(gr,"A",{href:!0});var Dl=i(Kt);Ni=o(Dl,"Introduction to Design and Analysis of Experiments"),Dl.forEach(a),zi=o(gr," (George W. Cobb, 1998)"),gr.forEach(a),Mi=c(p),lt=s(p,"P",{class:!0});var yr=i(lt);Xt=s(yr,"A",{href:!0});var Wl=i(Xt);Oi=o(Wl,"There is only one test!"),Wl.forEach(a),Fi=o(yr," (Allen Downey, 2011)"),yr.forEach(a),Li=c(p),ct=s(p,"P",{class:!0});var _r=i(ct);Qt=s(_r,"A",{href:!0});var kl=i(Qt);Gi=o(kl,"Permutation Tests"),kl.forEach(a),Yi=o(_r," (Thomas Leeper, 2013)"),_r.forEach(a),Zi=c(p),Ji=s(p,"BR",{}),Ki=s(p,"BR",{}),Xi=c(p),$t=s(p,"H2",{class:!0});var Cl=i($t);Qi=o(Cl,"Resources"),Cl.forEach(a),$i=c(p),qe=s(p,"P",{class:!0}),i(qe).forEach(a),tr=c(p),ht=s(p,"P",{class:!0});var xr=i(ht);te=s(xr,"A",{href:!0});var jl=i(te);er=o(jl,"D3.js"),jl.forEach(a),sr=o(xr," (Mike Bostock)"),xr.forEach(a),nr=c(p),pt=s(p,"P",{class:!0});var Er=i(pt);ee=s(Er,"A",{href:!0});var Ul=i(ee);or=o(Ul,"Rough.js"),Ul.forEach(a),ar=o(Er," (Preet Shihn)"),Er.forEach(a),ir=c(p),ut=s(p,"P",{class:!0});var Rr=i(ut);se=s(Rr,"A",{href:!0});var Hl=i(se);rr=o(Hl,"scrollama.js"),Hl.forEach(a),lr=o(Rr," (Russel Goldenberg)"),Rr.forEach(a),p.forEach(a),cr=c(H),ne=s(H,"SCRIPT",{src:!0});var Ll=i(ne);Ll.forEach(a),hr=c(H),De=s(H,"SCRIPT",{});var Vl=i(De);pr=o(Vl,`// seet seed so numbers are always the same
		Math.seedrandom('seed');

		var container = d3.select('#scroll');
		var graphic = container.select('.scroll__graphic');
		var chart = graphic.select('.chart');
		var text = container.select('.scroll__text');
		var step = text.selectAll('.step');

		var scroller = scrollama();

		// generic window resize listener event
		function handleResize() {
			// 1. update height of step elements
			var stepHeight = Math.floor(window.innerHeight * 0.9); // was * .75
			step.style('height', stepHeight + 'px');
			// 2. update width/height of graphic element
			var bodyWidth = d3.select('body').node().offsetWidth;
			graphic.style('width', bodyWidth + 'px').style('height', window.innerHeight + 'px');
			var chartMargin = bodyWidth > 350 ? 32 : 10;
			var textWidth = text.node().offsetWidth;
			var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
			console.log('chartwidth:', chartWidth);
			chart
				.style('width', chartWidth + 'px')
				.style('height', Math.floor(window.innerHeight / 1.2) + 'px');
			// 3. tell scrollama to update new element dimensions
			scroller.resize();
		}

		// scrollama event handlers
		function handleStepEnter(response) {
			// add color to current step only
			step.classed('is-active', function (d, i) {
				return i === response.index;
			});

			// console.log('response index:' + response.index)

			if ((response.index == 0) & (response.direction == 'down')) {
				console.log('0 down');
				transitionZeroDown();
			} else if ((response.index == 0) & (response.direction == 'up')) {
				console.log('0 up');
				transitionZeroUp();
			} else if ((response.index == 1) & (response.direction == 'down')) {
				console.log('1 down');
				transitionOneDown();
			} else if ((response.index == 1) & (response.direction == 'up')) {
				console.log('1 up');
				transitionOneUp();
			} else if ((response.index == 2) & (response.direction == 'up')) {
				console.log('2 up');
				transitionTwoUp();
			} else if ((response.index == 2) & (response.direction == 'down')) {
				console.log('2 down');
				transitionTwoDown();
			} else if ((response.index == 3) & (response.direction == 'up')) {
				console.log('3 up');
				transitionThreeUp();
				moveNodes();
			} else if ((response.index == 3) & (response.direction == 'down')) {
				console.log('3 down');
				transitionThreeDown();
			} else if ((response.index == 4) & (response.direction == 'up')) {
				console.log('4 up');
				transitionFourUp();
			} else if ((response.index == 4) & (response.direction == 'down')) {
				console.log('4 down');
				transitionFourDown();
			} else if ((response.index == 5) & (response.direction == 'up')) {
				console.log('5 up');
				transitionFiveUp();
			} else if ((response.index == 5) & (response.direction == 'down')) {
				console.log('5 down');
				transitionFiveDown();
			} else if ((response.index == 6) & (response.direction == 'up')) {
				console.log('6 up');
				transitionSixUp();
			} else if ((response.index == 6) & (response.direction == 'down')) {
				console.log('6 down');
				transitionSixDown();
			} else if ((response.index == 7) & (response.direction == 'up')) {
				console.log('7 up');
				transitionSevenUp();
			} else if ((response.index == 7) & (response.direction == 'down')) {
				console.log('7 down');
				transitionSevenDown();
			} else if ((response.index == 8) & (response.direction == 'up')) {
				console.log('8 up');
				transitionEightUp();
			} else if ((response.index == 8) & (response.direction == 'down')) {
				console.log('8 down');
				transitionEightDown();
			} else {
				console.log('else case, response index: ', response.index);
			}
		}

		function handleContainerEnter(response) {
			graphic.classed('is-fixed', true);
			graphic.classed('is-bottom', false);
		}
		function handleContainerExit(response) {
			graphic.classed('is-fixed', false);
			graphic.classed('is-bottom', response.direction === 'down');
			if (response.direction === 'down') {
				transitionExit();
			}
		}

		function init() {
			handleResize();
			scroller
				.setup({
					container: '#scroll',
					graphic: '.scroll__graphic',
					text: '.scroll__text',
					step: '.scroll__text .step',
					debug: false
				})
				.onStepEnter(handleStepEnter)
				.onContainerEnter(handleContainerEnter)
				.onContainerExit(handleContainerExit);
			window.addEventListener('resize', handleResize);
		}
		init();`),Vl.forEach(a),ur=c(H),oe=s(H,"SCRIPT",{src:!0});var Gl=i(oe);Gl.forEach(a),H.forEach(a),this.h()},h(){r(Ce,"charset","utf-8"),r(ae,"http-equiv","X-UA-Compatible"),r(ae,"content","IE=edge"),r(re,"name","description"),r(re,"content","Permutation Test: Visual Explanation"),r(le,"name","viewport"),r(le,"content","width=device-width, initial-scale=1"),ke(dt.src,Ir="/permutationtest/assets/d3.min.js")||r(dt,"src",Ir),r(ce,"rel","stylesheet"),r(ce,"href","/permutationtest/css/permutationTest.css"),ke(ft.src,Pr="/permutationtest/assets/rough.min.js")||r(ft,"src",Pr),ke(mt.src,Ar="/permutationtest/assets/seedrandom.min.js")||r(mt,"src",Ar),r(bt,"href","https://twitter.com/jdwlbr"),r(tt,"class","intro__overline"),r(vt,"class","intro__hed"),r(wt,"class","intro__dek"),r(gt,"class","fb_highlight_one"),r(yt,"class","fb_highlight_two"),r(_t,"class","tooltiptext"),r(et,"class","tooltip"),r(xt,"href","#"),r(x,"class","intro__bod"),r(U,"id","intro"),r(st,"id","svg"),Nl(st,"width","100%"),Nl(st,"height","100%"),r(Rt,"class","chart"),r(Et,"class","scroll__graphic"),r(Bt,"class","subheader"),r(Tt,"class","tooltiptext"),r(nt,"class","tooltip"),r(It,"href","https://en.wikipedia.org/wiki/Statistical_hypothesis_testing#The_testing_process"),r(M,"class","step"),r(M,"data-step","1"),r(Pt,"class","subheader"),r(O,"class","step"),r(O,"data-step","2"),r(At,"class","subheader"),r(St,"href","https://www.statpac.com/surveys/statistical-significance.htm"),r(F,"class","step"),r(F,"data-step","3"),r(qt,"class","subheader"),r(Dt,"href","https://en.wikipedia.org/wiki/Test_statistic"),r(Wt,"class","tooltiptext"),r(ot,"class","tooltip"),r(L,"class","step"),r(L,"data-step","4"),r(kt,"class","subheader"),r(Ct,"class","tooltiptext"),r(at,"class","tooltip"),r(G,"class","step"),r(G,"data-step","5"),r(jt,"class","subheader"),r(Ut,"href","https://en.wikipedia.org/wiki/Factorial"),r(Y,"class","step"),r(Y,"data-step","6"),r(Ht,"class","subheader"),r(Vt,"class","tooltiptext"),r(it,"class","tooltip"),r(Nt,"href","#"),r(Z,"class","step"),r(Z,"data-step","7"),r(zt,"class","subheader"),r(Mt,"href","https://statisticsbyjim.com/glossary/significance-level/"),r(J,"class","step"),r(J,"data-step","8"),r(Ot,"class","subheader"),r(K,"class","step finalStep"),r(K,"data-step","9"),r(Ft,"class","step finalStep"),r(Ft,"data-step","10"),r(g,"class","scroll__text"),r(Q,"id","scroll"),r(Lt,"class","subheader"),r(X,"class","intro__bod"),r(Gt,"class","intro__bod"),r(Yt,"class","intro__bod"),r(Zt,"class","intro__bod"),r(S,"class","intro__bod"),r(Jt,"class","subheader"),r(Se,"class","intro__bod"),r(Kt,"href","https://www.wiley.com/en-us/Introduction+to+Design+and+Analysis+of+Experiments-p-9780470412169"),r(rt,"class","intro__bod"),r(Xt,"href","http://allendowney.blogspot.com/2011/05/there-is-only-one-test.html"),r(lt,"class","intro__bod"),r(Qt,"href","https://thomasleeper.com/Rcourse/Tutorials/permutationtests.html"),r(ct,"class","intro__bod"),r($t,"class","subheader"),r(qe,"class","intro__bod"),r(te,"href","https://d3js.org/"),r(ht,"class","intro__bod"),r(ee,"href","https://roughjs.com/"),r(pt,"class","intro__bod"),r(se,"href","https://github.com/russellgoldenberg/scrollama"),r(ut,"class","intro__bod"),r(h,"id","conclusion"),ke(ne.src,Sr="/permutationtest/assets/scrollama.min.js")||r(ne,"src",Sr),ke(oe.src,qr="/permutationtest/js/permutationTest.js")||r(oe,"src",qr)},m(N,y){Br(N,w,y),t(w,Ce),t(w,Ye),t(w,ae),t(w,Ze),t(w,ie),t(ie,Je),t(w,Ke),t(w,re),t(w,Xe),t(w,le),t(w,Qe),t(w,dt),t(w,$e),t(w,ce),t(w,ts),t(w,ft),t(w,es),t(w,mt),Br(N,je,y),Br(N,P,y),t(P,U),t(U,tt),t(tt,ss),t(tt,bt),t(bt,ns),t(U,os),t(U,vt),t(vt,as),t(U,is),t(U,wt),t(wt,rs),t(U,ls),t(U,x),t(x,cs),t(x,gt),t(gt,hs),t(x,ps),t(x,yt),t(yt,us),t(x,ds),t(x,et),t(et,fs),t(et,_t),t(_t,ms),t(x,bs),t(x,vs),t(x,ws),t(x,gs),t(x,xt),t(xt,ys),t(x,_s),t(P,xs),t(P,Q),t(Q,Et),t(Et,Rt),t(Rt,st),t(Q,Es),t(Q,g),t(g,M),t(M,Bt),t(Bt,Rs),t(M,Bs),t(M,u),t(u,Ts),t(u,nt),t(nt,Is),t(nt,Tt),t(Tt,Ps),t(u,As),t(u,Ss),t(u,qs),t(u,Ds),t(u,Ws),t(u,ks),t(u,Cs),t(u,It),t(It,js),t(u,Us),t(u,he),t(he,Hs),t(u,Vs),t(u,Ns),t(u,zs),t(u,Ms),t(u,Os),t(u,Fs),t(u,pe),t(pe,Ls),t(u,Gs),t(u,ue),t(ue,Ys),t(u,Zs),t(u,de),t(de,Js),t(u,Ks),t(u,Xs),t(u,Qs),t(u,$s),t(u,fe),t(fe,tn),t(u,en),t(u,sn),t(u,nn),t(g,on),t(g,O),t(O,Pt),t(Pt,an),t(O,rn),t(O,E),t(E,ln),t(E,cn),t(E,hn),t(E,pn),t(E,me),t(me,un),t(E,dn),t(E,be),t(be,fn),t(E,mn),t(E,ve),t(ve,bn),t(E,vn),t(E,wn),t(E,gn),t(E,yn),t(g,_n),t(g,F),t(F,At),t(At,xn),t(F,En),t(F,A),t(A,Rn),t(A,Bn),t(A,Tn),t(A,In),t(A,we),t(we,Pn),t(A,An),t(A,Sn),t(A,qn),t(A,Dn),t(A,St),t(St,Wn),t(A,kn),t(g,Cn),t(g,L),t(L,qt),t(qt,jn),t(L,Un),t(L,d),t(d,Hn),t(d,Vn),t(d,Nn),t(d,zn),t(d,Dt),t(Dt,Mn),t(d,On),t(d,Fn),t(d,Ln),t(d,Gn),t(d,ot),t(ot,Yn),t(ot,Wt),t(Wt,Zn),t(d,Jn),t(d,Kn),t(d,Xn),t(d,Qn),t(d,ge),t(ge,$n),t(d,to),t(d,ye),t(ye,eo),t(d,so),t(d,_e),t(_e,no),t(d,oo),t(d,ao),t(d,io),t(d,ro),t(d,lo),t(d,xe),t(xe,co),t(d,ho),t(d,Ee),t(Ee,po),t(d,uo),t(g,fo),t(g,G),t(G,kt),t(kt,mo),t(G,bo),t(G,R),t(R,vo),t(R,at),t(at,wo),t(at,Ct),t(Ct,go),t(R,yo),t(R,_o),t(R,xo),t(R,Eo),t(R,Ro),t(R,Bo),t(R,To),t(R,Io),t(R,Po),t(R,Ao),t(R,So),t(g,qo),t(g,Y),t(Y,jt),t(jt,Do),t(Y,Wo),t(Y,B),t(B,ko),t(B,Co),t(B,jo),t(B,Uo),t(B,Re),t(Re,Ho),t(B,Vo),t(B,No),t(B,zo),t(B,Mo),t(B,Ut),t(Ut,Oo),t(B,Fo),t(B,Lo),t(B,Go),t(g,Yo),t(g,Z),t(Z,Ht),t(Ht,Zo),t(Z,Jo),t(Z,T),t(T,Ko),t(T,Xo),t(T,Qo),t(T,$o),t(T,Be),t(Be,ta),t(T,ea),t(T,it),t(it,sa),t(it,Vt),t(Vt,na),t(T,oa),t(T,aa),t(T,ia),t(T,ra),t(T,Nt),t(Nt,la),t(T,ca),t(g,ha),t(g,J),t(J,zt),t(zt,pa),t(J,ua),t(J,I),t(I,da),t(I,Te),t(Te,fa),t(I,ma),t(I,ba),t(I,va),t(I,wa),t(I,Mt),t(Mt,ga),t(I,ya),t(I,_a),t(I,xa),t(I,Ea),t(I,Ra),t(I,Ba),t(g,Ta),t(g,K),t(K,Ot),t(Ot,Ia),t(K,Pa),t(K,b),t(b,Aa),t(b,Ie),t(Ie,Sa),t(b,qa),t(b,Da),t(b,Wa),t(b,ka),t(b,Ca),t(b,ja),t(b,Ua),t(b,Ha),t(b,Va),t(b,Na),t(b,za),t(b,Ma),t(b,Oa),t(b,Fa),t(b,La),t(b,Ga),t(b,Ya),t(b,Za),t(b,Ja),t(b,Ka),t(b,Xa),t(b,Qa),t(g,$a),t(g,Ft),t(P,ti),t(P,h),t(h,Lt),t(Lt,ei),t(h,si),t(h,X),t(X,ni),t(X,oi),t(X,ai),t(X,ii),t(h,ri),t(h,li),t(h,ci),t(h,Gt),t(Gt,hi),t(h,pi),t(h,Yt),t(Yt,ui),t(h,di),t(h,Zt),t(Zt,fi),t(h,mi),t(h,bi),t(h,vi),t(h,S),t(S,wi),t(S,Pe),t(Pe,gi),t(S,yi),t(S,_i),t(S,xi),t(S,Ei),t(S,Ae),t(Ae,Ri),t(S,Bi),t(S,Ti),t(S,Ii),t(h,Pi),t(h,Ai),t(h,Si),t(h,qi),t(h,Di),t(h,Wi),t(h,ki),t(h,Ci),t(h,ji),t(h,Jt),t(Jt,Ui),t(h,Hi),t(h,Se),t(h,Vi),t(h,rt),t(rt,Kt),t(Kt,Ni),t(rt,zi),t(h,Mi),t(h,lt),t(lt,Xt),t(Xt,Oi),t(lt,Fi),t(h,Li),t(h,ct),t(ct,Qt),t(Qt,Gi),t(ct,Yi),t(h,Zi),t(h,Ji),t(h,Ki),t(h,Xi),t(h,$t),t($t,Qi),t(h,$i),t(h,qe),t(h,tr),t(h,ht),t(ht,te),t(te,er),t(ht,sr),t(h,nr),t(h,pt),t(pt,ee),t(ee,or),t(pt,ar),t(h,ir),t(h,ut),t(ut,se),t(se,rr),t(ut,lr),t(P,cr),t(P,ne),t(P,hr),t(P,De),t(De,pr),t(P,ur),t(P,oe)},p:Tr,i:Tr,o:Tr,d(N){N&&a(w),N&&a(je),N&&a(P)}}}class tc extends Yl{constructor(w){super(),Zl(this,w,null,Ql,Jl,{})}}export{tc as default};
