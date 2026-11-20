// Translations: English (default), Urdu, Spanish, French, Chinese, Arabic, Turkish.
// Each row: [key, en, ur, es, fr, zh, ar, tr]. A row with one value is the same in every language.

export const LANGS = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'ur', name: 'اردو', rtl: true },
  { code: 'es', name: 'Español', rtl: false },
  { code: 'fr', name: 'Français', rtl: false },
  { code: 'zh', name: '中文', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'tr', name: 'Türkçe', rtl: false },
];
const ORDER = LANGS.map((l) => l.code);
// Menu order: English (default) first, then the other languages A to Z by English name.
const EN_NAME = { ur: 'Urdu', es: 'Spanish', fr: 'French', zh: 'Chinese', ar: 'Arabic', tr: 'Turkish' };
export const LANG_MENU = [LANGS[0], ...LANGS.slice(1).sort((a, b) => EN_NAME[a.code].localeCompare(EN_NAME[b.code]))];

const ROWS = [
  ['meta.title', 'Hasan Abbasi | 3D Artist', 'حسن عباسی | تھری ڈی آرٹسٹ', 'Hasan Abbasi | Artista 3D', 'Hasan Abbasi | Artiste 3D', 'Hasan Abbasi | 3D 艺术家', 'حسن عباسي | فنان ثلاثي الأبعاد', 'Hasan Abbasi | 3D Sanatçı'],
  ['skip', 'Skip to content', 'مواد پر جائیں', 'Saltar al contenido', 'Aller au contenu', '跳到内容', 'تخطَّ إلى المحتوى', 'İçeriğe geç'],
  ['brand.aria', 'Hasan Abbasi, home', 'حسن عباسی، ہوم', 'Hasan Abbasi, inicio', 'Hasan Abbasi, accueil', 'Hasan Abbasi，首页', 'حسن عباسي، الرئيسية', 'Hasan Abbasi, ana sayfa'],
  ['nav.home', 'Home', 'ہوم', 'Inicio', 'Accueil', '首页', 'الرئيسية', 'Ana sayfa'],
  ['nav.about', 'About', 'تعارف', 'Sobre mí', 'À propos', '关于', 'نبذة', 'Hakkımda'],
  ['nav.skills', 'Skills', 'مہارتیں', 'Habilidades', 'Compétences', '技能', 'المهارات', 'Yetenekler'],
  ['nav.projects', 'Projects', 'پروجیکٹس', 'Proyectos', 'Projets', '项目', 'المشاريع', 'Projeler'],
  ['nav.experience', 'Experience', 'تجربہ', 'Experiencia', 'Expérience', '经历', 'الخبرة', 'Deneyim'],
  ['nav.contact', 'Contact', 'رابطہ', 'Contacto', 'Contact', '联系', 'التواصل', 'İletişim'],
  ['nav.aria', 'Main', 'مین', 'Principal', 'Principale', '主导航', 'الرئيسية', 'Ana'],
  ['burger.open', 'Open menu', 'مینو کھولیں', 'Abrir menú', 'Ouvrir le menu', '打开菜单', 'افتح القائمة', 'Menüyü aç'],
  ['burger.close', 'Close menu', 'مینو بند کریں', 'Cerrar menú', 'Fermer le menu', '关闭菜单', 'أغلق القائمة', 'Menüyü kapat'],
  ['pipe.aria', 'Render pipeline progress', 'رینڈر پائپ لائن کی پیش رفت', 'Progreso del pipeline de render', 'Progression du pipeline de rendu', '渲染流程进度', 'تقدّم مسار الريندر', 'Render hattı ilerlemesi'],
  ['st.vertices', 'Vertices', 'ورٹیکس', 'Vértices', 'Sommets', '顶点', 'الرؤوس', 'Köşeler'],
  ['st.wireframe', 'Wireframe', 'وائر فریم', 'Malla', 'Fil de fer', '线框', 'الإطار السلكي', 'Tel kafes'],
  ['st.material', 'Material', 'میٹریل', 'Material', 'Matière', '材质', 'الخامة', 'Malzeme'],
  ['st.matprev', 'Material Preview', 'میٹریل پریویو', 'Vista previa de materiales', 'Aperçu des matériaux', '材质预览', 'معاينة المواد', 'Malzeme önizleme'],
  ['st.render', 'Render', 'رینڈر', 'Render', 'Rendu', '渲染', 'الريندر', 'Render'],
  ['st.animation', 'Animation', 'اینیمیشن', 'Animación', 'Animation', '动画', 'الحركة', 'Animasyon'],
  ['st.export', 'Export', 'ایکسپورٹ', 'Exportar', 'Export', '导出', 'التصدير', 'Dışa aktar'],
  ['st.clay', 'Clay', 'کلے', 'Arcilla', 'Argile', '黏土', 'الطين', 'Kil'],

  ['hero.tag', '3D artist · animator · game developer', 'تھری ڈی آرٹسٹ · اینیمیٹر · گیم ڈویلپر', 'Artista 3D · animador · desarrollador de juegos', 'Artiste 3D · animateur · développeur de jeux', '3D 艺术家 · 动画师 · 游戏开发者', 'فنان ثلاثي الأبعاد · رسّام متحرك · مطوّر ألعاب', '3D sanatçı · animatör · oyun geliştirici'],
  ['hero.lead', 'I model and animate 3D characters and worlds, then build them into games in Unity and Unreal Engine.', 'میں تھری ڈی کردار اور دنیائیں بناتا اور متحرک کرتا ہوں، پھر انہیں Unity اور Unreal Engine میں گیمز کی شکل دیتا ہوں۔', 'Modelo y animo personajes y mundos en 3D, y luego los convierto en juegos con Unity y Unreal Engine.', "Je modélise et j'anime des personnages et des mondes en 3D, puis j'en fais des jeux avec Unity et Unreal Engine.", '我制作 3D 角色和场景并为其添加动画，再用 Unity 和 Unreal Engine 把它们做成游戏。', 'أصمّم وأحرّك شخصيات وعوالم ثلاثية الأبعاد، ثم أحوّلها إلى ألعاب باستخدام Unity وUnreal Engine.', '3D karakterler ve dünyalar modelleyip canlandırıyor, ardından Unity ve Unreal Engine ile oyunlara dönüştürüyorum.'],
  ['hero.watch', 'Watch it render', 'رینڈر ہوتا دیکھیں', 'Míralo renderizar', 'Regarder le rendu', '观看渲染', 'شاهد الريندر', "Render'ı izle"],
  ['hero.hello', 'Say hello', 'ہیلو کہیں', 'Saluda', 'Dis bonjour', '打个招呼', 'قل مرحباً', 'Merhaba de'],
  ['hero.meta', 'BS Computer Science · Gaming and Animation · NED University', 'بی ایس کمپیوٹر سائنس · گیمنگ اور اینیمیشن · این ای ڈی یونیورسٹی', 'Licenciatura en Informática · Videojuegos y Animación · NED University', 'Licence en informatique · Jeux vidéo et animation · NED University', '计算机科学学士 · 游戏与动画 · NED 大学', 'بكالوريوس علوم الحاسوب · الألعاب والرسوم المتحركة · جامعة NED', 'Bilgisayar Bilimleri Lisans · Oyun ve Animasyon · NED Üniversitesi'],
  ['hero.hint', 'Tip: click the avatar, or press K for the quick menu', 'ٹپ: ایواٹار پر کلک کریں، یا فوری مینو کے لیے K دبائیں', 'Consejo: haz clic en el avatar o pulsa K para el menú rápido', "Astuce : cliquez sur l'avatar ou appuyez sur K pour le menu rapide", '提示：点击头像，或按 K 打开快捷菜单', 'تلميح: انقر على الشخصية أو اضغط K للقائمة السريعة', "İpucu: avatara tıkla veya hızlı menü için K'ye bas"],
  ['hero.scroll', 'Scroll', 'سکرول کریں', 'Desliza', 'Défiler', '向下滚动', 'مرّر', 'Kaydır'],

  ['about.eyebrow', '02 · Wireframe', '02 · وائر فریم', '02 · Malla', '02 · Fil de fer', '02 · 线框', '02 · الإطار السلكي', '02 · Tel kafes'],
  ['about.h2', 'The structure<br>under the surface', 'سطح کے نیچے<br>کا ڈھانچہ', 'La estructura<br>bajo la superficie', 'La structure<br>sous la surface', '表面之下<br>的结构', 'البنية<br>تحت السطح', 'Yüzeyin<br>altındaki yapı'],
  ['about.p1', "I'm a 3D artist at heart. Modelling and animation are where I spend most of my time, mostly in Blender, where I'm most at home.", 'میں دل سے تھری ڈی آرٹسٹ ہوں۔ میرا زیادہ تر وقت ماڈلنگ اور اینیمیشن میں گزرتا ہے، زیادہ تر Blender میں جہاں میں سب سے زیادہ آرام محسوس کرتا ہوں۔', 'Soy artista 3D de corazón. Paso la mayor parte del tiempo modelando y animando, sobre todo en Blender, donde me siento más a gusto.', "Je suis un artiste 3D dans l'âme. Je passe le plus clair de mon temps à modéliser et animer, surtout dans Blender, où je suis le plus à l'aise.", '我骨子里是一名 3D 艺术家。我大部分时间都花在建模和动画上，主要使用 Blender，那是我最得心应手的工具。', 'أنا فنان ثلاثي الأبعاد بالفطرة. أقضي معظم وقتي في النمذجة والتحريك، وغالباً في Blender حيث أشعر بأنني في بيتي.', "Özünde bir 3D sanatçıyım. Zamanımın çoğunu modelleme ve animasyonla geçiriyorum, çoğunlukla en rahat olduğum Blender'da."],
  ['about.p2', "I also build games. I've worked in both Unity and Unreal Engine and made games in each, so I care about how a model behaves once it leaves the viewport and lands in an engine.", 'میں گیمز بھی بناتا ہوں۔ میں نے Unity اور Unreal Engine دونوں میں کام کیا ہے اور دونوں میں گیمز بنائے ہیں، اس لیے مجھے اس بات کی فکر رہتی ہے کہ ماڈل ویو پورٹ سے نکل کر انجن میں کیسا برتاؤ کرتا ہے۔', 'También hago juegos. He trabajado con Unity y Unreal Engine y he creado juegos en ambos, así que me importa cómo se comporta un modelo cuando sale del visor y llega a un motor.', "Je crée aussi des jeux. J'ai travaillé avec Unity et Unreal Engine et réalisé des jeux dans chacun, donc je m'intéresse à la façon dont un modèle se comporte une fois sorti du viewport et intégré dans un moteur.", '我也开发游戏。我用过 Unity 和 Unreal Engine，并在两者中都做过游戏，所以我很在意模型离开视口、进入引擎之后的表现。', 'أطوّر الألعاب أيضاً. عملت على Unity وUnreal Engine وصنعت ألعاباً في كل منهما، لذا يهمني كيف يتصرف النموذج بعد أن يغادر نافذة العرض ويدخل المحرّك.', "Oyun da geliştiriyorum. Hem Unity hem Unreal Engine'de çalıştım ve ikisinde de oyunlar yaptım; bu yüzden bir modelin görünüm penceresinden çıkıp motora girdiğinde nasıl davrandığı benim için önemli."],
  ['about.p3', "I'm studying BS Computer Science (Gaming and Animation) at NED University, and I've completed the CEGA game development courses and the Google AI Professional Certificate. I'm looking to bring my 3D art and programming skills to a team building engaging games.", 'میں NED یونیورسٹی میں بی ایس کمپیوٹر سائنس (گیمنگ اور اینیمیشن) پڑھ رہا ہوں، اور میں نے CEGA گیم ڈویلپمنٹ کورسز اور Google AI پروفیشنل سرٹیفکیٹ مکمل کیا ہے۔ میں اپنی تھری ڈی آرٹ اور پروگرامنگ مہارتیں ایسی ٹیم کو دینا چاہتا ہوں جو دلچسپ گیمز بناتی ہو۔', 'Estudio la licenciatura en Informática (Videojuegos y Animación) en NED University y he completado los cursos de desarrollo de juegos de CEGA y el Certificado Profesional de Google AI. Busco aportar mis habilidades de arte 3D y programación a un equipo que cree juegos atractivos.', "J'étudie la licence en informatique (Jeux vidéo et animation) à NED University et j'ai terminé les cours de développement de jeux CEGA ainsi que le certificat professionnel Google AI. Je souhaite apporter mes compétences en art 3D et en programmation à une équipe qui crée des jeux captivants.", '我在 NED 大学攻读计算机科学学士（游戏与动画方向），并已完成 CEGA 游戏开发课程和 Google AI 专业证书。我希望把我的 3D 美术和编程技能带给一支制作精彩游戏的团队。', 'أدرس بكالوريوس علوم الحاسوب (الألعاب والرسوم المتحركة) في جامعة NED، وقد أنهيت دورات CEGA لتطوير الألعاب وشهادة Google AI المهنية. أتطلع إلى تقديم مهاراتي في الفن ثلاثي الأبعاد والبرمجة لفريق يصنع ألعاباً ممتعة.', "NED Üniversitesi'nde Bilgisayar Bilimleri (Oyun ve Animasyon) lisansı okuyorum; CEGA oyun geliştirme kurslarını ve Google AI Profesyonel Sertifikası'nı tamamladım. 3D sanat ve programlama becerilerimi etkileyici oyunlar yapan bir ekibe katmak istiyorum."],
  ['about.view', 'View CV', 'سی وی دیکھیں', 'Ver CV', 'Voir le CV', '查看简历', 'عرض السيرة الذاتية', "CV'yi görüntüle"],
  ['about.download', 'Download CV', 'سی وی ڈاؤن لوڈ کریں', 'Descargar CV', 'Télécharger le CV', '下载简历', 'تحميل السيرة الذاتية', "CV'yi indir"],
  ['props.header', 'Object Properties', 'آبجیکٹ پراپرٹیز', 'Propiedades del objeto', "Propriétés de l'objet", '对象属性', 'خصائص العنصر', 'Nesne Özellikleri'],
  ['props.aria', 'Properties', 'پراپرٹیز', 'Propiedades', 'Propriétés', '属性', 'الخصائص', 'Özellikler'],
  ['p.name', 'Name', 'نام', 'Nombre', 'Nom', '姓名', 'الاسم', 'Ad'],
  ['p.discipline', 'Discipline', 'شعبہ', 'Disciplina', 'Domaine', '领域', 'التخصص', 'Alan'],
  ['p.soft', 'Soft skills', 'نرم مہارتیں', 'Habilidades blandas', 'Compétences humaines', '软技能', 'المهارات الشخصية', 'Sosyal beceriler'],
  ['p.int', 'Interests', 'دلچسپیاں', 'Intereses', "Centres d'intérêt", '兴趣', 'الاهتمامات', 'İlgi alanları'],
  ['v.discipline', '3D modelling, animation', 'تھری ڈی ماڈلنگ، اینیمیشن', 'Modelado 3D, animación', 'Modélisation 3D, animation', '3D 建模、动画', 'النمذجة ثلاثية الأبعاد، التحريك', '3D modelleme, animasyon'],
  ['v.soft', 'Problem solving, critical thinking, teamwork, open to feedback', 'مسائل حل کرنا، تنقیدی سوچ، ٹیم ورک، رائے کے لیے کھلا پن', 'Resolución de problemas, pensamiento crítico, trabajo en equipo, abierto a comentarios', 'Résolution de problèmes, esprit critique, travail d\'équipe, ouvert aux retours', '解决问题、批判性思维、团队合作、乐于接受反馈', 'حل المشكلات، التفكير النقدي، العمل الجماعي، الانفتاح على الملاحظات', 'Problem çözme, eleştirel düşünme, takım çalışması, geri bildirime açıklık'],
  ['v.int', 'Game development, animation', 'گیم ڈویلپمنٹ، اینیمیشن', 'Desarrollo de juegos, animación', 'Développement de jeux, animation', '游戏开发、动画', 'تطوير الألعاب، الرسوم المتحركة', 'Oyun geliştirme, animasyon'],

  ['skills.eyebrow', '03 · Material', '03 · میٹریل', '03 · Material', '03 · Matière', '03 · 材质', '03 · الخامة', '03 · Malzeme'],
  ['skills.h2', 'Skills, wired together', 'مہارتیں، آپس میں جڑی ہوئی', 'Habilidades, conectadas', 'Compétences, reliées entre elles', '技能，相互连接', 'مهارات مترابطة', 'Birbirine bağlı yetenekler'],
  ['skills.p', 'Every skill is a node, wired through its group into one material output. Hover or focus a node to follow its wire.', 'ہر مہارت ایک نوڈ ہے جو اپنے گروپ کے ذریعے ایک میٹریل آؤٹ پٹ سے جڑی ہے۔ تار کو دیکھنے کے لیے نوڈ پر ماؤس لے جائیں یا فوکس کریں۔', 'Cada habilidad es un nodo conectado, a través de su grupo, a una única salida de material. Pasa el cursor o enfoca un nodo para seguir su cable.', 'Chaque compétence est un nœud relié, via son groupe, à une seule sortie matériau. Survolez ou sélectionnez un nœud pour suivre son fil.', '每项技能都是一个节点，通过所属分组连接到同一个材质输出。悬停或聚焦节点即可查看其连线。', 'كل مهارة هي عقدة موصولة عبر مجموعتها بمخرج خامة واحد. مرّر المؤشر على عقدة أو ركّز عليها لتتبّع سلكها.', 'Her yetenek bir düğümdür ve grubu üzerinden tek bir malzeme çıkışına bağlanır. Teli takip etmek için bir düğümün üzerine gelin veya odaklanın.'],
  ['g.3D', '3D', 'تھری ڈی', '3D', '3D', '3D', 'ثلاثي الأبعاد', '3D'],
  ['g.Engines', 'Engines', 'انجن', 'Motores', 'Moteurs', '引擎', 'المحرّكات', 'Motorlar'],
  ['g.Code', 'Code', 'کوڈ', 'Código', 'Code', '代码', 'البرمجة', 'Kod'],
  ['g.aria', 'group', 'گروپ', 'grupo', 'groupe', '分组', 'مجموعة', 'grup'],
  ['node.mix', 'Mix', 'مکس', 'Mezcla', 'Mélange', '混合', 'دمج', 'Karışım'],
  ['out.title', 'Material Output', 'میٹریل آؤٹ پٹ', 'Salida de material', 'Sortie matériau', '材质输出', 'مخرج الخامة', 'Malzeme Çıkışı'],
  ['out.surface', 'Surface', 'سطح', 'Superficie', 'Surface', '表面', 'السطح', 'Yüzey'],
  ['out.volume', 'Volume', 'والیوم', 'Volumen', 'Volume', '体积', 'الحجم', 'Hacim'],
  ['out.displace', 'Displace', 'ڈسپلیس', 'Desplazamiento', 'Déplacement', '置换', 'الإزاحة', 'Yer değiştirme'],
  ['out.v2', '3D artist', 'تھری ڈی آرٹسٹ', 'Artista 3D', 'Artiste 3D', '3D 艺术家', 'فنان ثلاثي الأبعاد', '3D sanatçı'],
  ['out.v3', 'Games', 'گیمز', 'Juegos', 'Jeux', '游戏', 'الألعاب', 'Oyunlar'],
  ['out.aria', 'Material output: Hasan Abbasi, 3D artist', 'میٹریل آؤٹ پٹ: حسن عباسی، تھری ڈی آرٹسٹ', 'Salida de material: Hasan Abbasi, artista 3D', 'Sortie matériau : Hasan Abbasi, artiste 3D', '材质输出：Hasan Abbasi，3D 艺术家', 'مخرج الخامة: حسن عباسي، فنان ثلاثي الأبعاد', 'Malzeme çıkışı: Hasan Abbasi, 3D sanatçı'],

  ['projects.eyebrow', '04 · Render', '04 · رینڈر', '04 · Render', '04 · Rendu', '04 · 渲染', '04 · الريندر', '04 · Render'],
  ['projects.h2', 'Render queue', 'رینڈر قطار', 'Cola de render', 'File de rendu', '渲染队列', 'قائمة الريندر', 'Render kuyruğu'],
  ['projects.lead', 'Finished renders, game builds and breakdowns will land here. The queue is being filled right now.', 'مکمل رینڈرز، گیم بلڈز اور بریک ڈاؤنز یہاں شامل ہوں گے۔ قطار ابھی بھری جا رہی ہے۔', 'Aquí aparecerán renders terminados, builds de juegos y desgloses. La cola se está llenando ahora mismo.', 'Les rendus terminés, les builds de jeux et les making-of arriveront ici. La file se remplit en ce moment.', '完成的渲染、游戏构建和制作解析将陆续放在这里。队列正在填充中。', 'ستظهر هنا الأعمال المكتملة ونسخ الألعاب وتفاصيل العمل. القائمة تُملأ الآن.', 'Tamamlanan render\'lar, oyun sürümleri ve çalışma dökümleri burada yer alacak. Kuyruk şu anda dolduruluyor.'],
  ['projects.h2b', 'Finished renders', 'مکمل رینڈرز', 'Renders terminados', 'Rendus terminés', '完成的渲染', 'أعمال مكتملة', "Tamamlanan render'lar"],
  ['projects.leadb', 'Blender models, browser games, and Unity and Unreal projects. Open any card to look closer, rotate it, play it, or watch it.', 'Blender ماڈلز، براؤزر گیمز، اور Unity اور Unreal پروجیکٹس۔ قریب سے دیکھنے، گھمانے، کھیلنے یا دیکھنے کے لیے کوئی بھی کارڈ کھولیں۔', 'Modelos de Blender, juegos de navegador y proyectos de Unity y Unreal. Abre cualquier tarjeta para verla de cerca, girarla, jugarla o ver el vídeo.', 'Modèles Blender, jeux navigateur et projets Unity et Unreal. Ouvrez une carte pour regarder de plus près, la faire pivoter, y jouer ou voir la vidéo.', 'Blender 模型、网页游戏以及 Unity 和 Unreal 项目。打开任意卡片即可近距离查看、旋转、试玩或观看视频。', 'نماذج Blender وألعاب المتصفح ومشاريع Unity وUnreal. افتح أي بطاقة لتقترب منها أو تدوّرها أو تلعبها أو تشاهد الفيديو.', "Blender modelleri, tarayıcı oyunları ile Unity ve Unreal projeleri. Yakından bakmak, döndürmek, oynamak veya videoyu izlemek için bir karta tıklayın."],
  ['f.all', 'All', 'سب', 'Todo', 'Tout', '全部', 'الكل', 'Tümü'],
  ['f.aria', 'Filter projects', 'پروجیکٹس فلٹر کریں', 'Filtrar proyectos', 'Filtrer les projets', '筛选项目', 'تصفية المشاريع', 'Projeleri filtrele'],
  ['t.model', '3D Model', 'تھری ڈی ماڈل', 'Modelo 3D', 'Modèle 3D', '3D 模型', 'نموذج ثلاثي الأبعاد', '3D Model'],
  ['t.web', 'Web Game', 'ویب گیم', 'Juego web', 'Jeu web', '网页游戏', 'لعبة ويب', 'Web Oyunu'],
  ['t.unreal', 'Unreal Game', 'Unreal گیم', 'Juego de Unreal', 'Jeu Unreal', 'Unreal 游戏', 'لعبة Unreal', 'Unreal Oyunu'],
  ['t.unity', 'Unity Game', 'Unity گیم', 'Juego de Unity', 'Jeu Unity', 'Unity 游戏', 'لعبة Unity', 'Unity Oyunu'],
  ['t.project', 'Project', 'پروجیکٹ', 'Proyecto', 'Projet', '项目', 'مشروع', 'Proje'],
  ['tab.model', '3D Models', 'تھری ڈی ماڈلز', 'Modelos 3D', 'Modèles 3D', '3D 模型', 'نماذج ثلاثية الأبعاد', '3D Modeller'],
  ['tab.web', 'Web Games', 'ویب گیمز', 'Juegos web', 'Jeux web', '网页游戏', 'ألعاب الويب', 'Web Oyunları'],
  ['tab.unreal', 'Unreal Games', 'Unreal گیمز', 'Juegos de Unreal', 'Jeux Unreal', 'Unreal 游戏', 'ألعاب Unreal', 'Unreal Oyunları'],
  ['tab.unity', 'Unity Games', 'Unity گیمز', 'Juegos de Unity', 'Jeux Unity', 'Unity 游戏', 'ألعاب Unity', 'Unity Oyunları'],
  ['b.model', 'Interactive 3D', 'انٹرایکٹو تھری ڈی', '3D interactivo', '3D interactif', '交互 3D', 'ثلاثي الأبعاد تفاعلي', 'Etkileşimli 3D'],
  ['b.play', 'Playable', 'قابلِ کھیل', 'Jugable', 'Jouable', '可试玩', 'قابلة للّعب', 'Oynanabilir'],
  ['b.video', 'Video', 'ویڈیو', 'Vídeo', 'Vidéo', '视频', 'فيديو', 'Video'],
  ['more.show', 'Show {n} more', 'مزید {n} دکھائیں', 'Mostrar {n} más', 'Afficher {n} de plus', '再显示 {n} 个', 'عرض {n} أخرى', '{n} tane daha göster'],
  ['more.fewer', 'Show fewer', 'کم دکھائیں', 'Mostrar menos', 'Afficher moins', '收起', 'عرض أقل', 'Daha az göster'],
  ['ghost.frame', 'Frame', 'فریم', 'Fotograma', 'Image', '帧', 'إطار', 'Kare'],
  ['ghost.waiting', 'Waiting', 'انتظار', 'Esperando', 'En attente', '等待中', 'بالانتظار', 'Bekliyor'],
  ['ghost.samples', 'Samples 0 / 128 · Slot open', 'سیمپلز 0 / 128 · جگہ خالی', 'Muestras 0 / 128 · Espacio libre', 'Échantillons 0 / 128 · Emplacement libre', '采样 0 / 128 · 空位', 'العيّنات 0 / 128 · مكان شاغر', 'Örnek 0 / 128 · Boş yuva'],
  ['ghost.aria', 'Empty project slot {n}', 'خالی پروجیکٹ سلاٹ {n}', 'Espacio de proyecto vacío {n}', 'Emplacement de projet vide {n}', '空项目位 {n}', 'خانة مشروع فارغة {n}', 'Boş proje yuvası {n}'],
  ['view.3d', '3D view', 'تھری ڈی ویو', 'Vista 3D', 'Vue 3D', '3D 视图', 'عرض ثلاثي الأبعاد', '3D görünüm'],
  ['view.play', 'Play', 'کھیلیں', 'Jugar', 'Jouer', '试玩', 'العب', 'Oyna'],
  ['view.video', 'Video', 'ویڈیو', 'Vídeo', 'Vidéo', '视频', 'فيديو', 'Video'],
  ['view.shots', 'Screenshots', 'اسکرین شاٹس', 'Capturas', "Captures d'écran", '截图', 'لقطات الشاشة', 'Ekran görüntüleri'],
  ['view.image', 'Rendered Image', 'رینڈر شدہ تصویر', 'Imagen renderizada', 'Image rendue', '渲染图', 'الصورة المُصيَّرة', 'Render görseli'],
  ['pm.loading', 'Loading model...', 'ماڈل لوڈ ہو رہا ہے...', 'Cargando modelo...', 'Chargement du modèle...', '正在加载模型...', 'جارٍ تحميل النموذج...', 'Model yükleniyor...'],
  ['pm.fail', 'Could not load the model file.', 'ماڈل فائل لوڈ نہیں ہو سکی۔', 'No se pudo cargar el archivo del modelo.', 'Impossible de charger le fichier du modèle.', '无法加载模型文件。', 'تعذّر تحميل ملف النموذج.', 'Model dosyası yüklenemedi.'],
  ['pm.nowebgl', 'This browser could not start the 3D viewer.', 'یہ براؤزر تھری ڈی ویور شروع نہیں کر سکا۔', 'Este navegador no pudo iniciar el visor 3D.', "Ce navigateur n'a pas pu démarrer la visionneuse 3D.", '此浏览器无法启动 3D 查看器。', 'تعذّر على هذا المتصفح تشغيل عارض ثلاثي الأبعاد.', 'Bu tarayıcı 3D görüntüleyiciyi başlatamadı.'],
  ['pm.hint', 'Drag to rotate · scroll to zoom', 'گھمانے کے لیے ڈریگ کریں · زوم کے لیے اسکرول کریں', 'Arrastra para girar · desplaza para acercar', 'Faites glisser pour tourner · défilez pour zoomer', '拖动旋转 · 滚轮缩放', 'اسحب للتدوير · مرّر للتكبير', 'Döndürmek için sürükle · yakınlaştırmak için kaydır'],
  ['pm.stage', 'Render stage', 'رینڈر مرحلہ', 'Fase de render', 'Étape de rendu', '渲染阶段', 'مرحلة الريندر', 'Render aşaması'],
  ['pm.play', 'Play {title}', '{title} کھیلیں', 'Jugar a {title}', 'Jouer à {title}', '试玩 {title}', 'العب {title}', '{title} oyna'],
  ['pm.full', 'Open full screen', 'فل اسکرین میں کھولیں', 'Abrir en pantalla completa', 'Ouvrir en plein écran', '全屏打开', 'افتح بملء الشاشة', 'Tam ekranda aç'],
  ['pm.noimg', 'No preview image yet', 'ابھی کوئی پیش منظر تصویر نہیں', 'Aún no hay imagen de vista previa', "Pas encore d'image d'aperçu", '暂无预览图', 'لا توجد صورة معاينة بعد', 'Henüz önizleme görseli yok'],
  ['pm.close', 'Close', 'بند کریں', 'Cerrar', 'Fermer', '关闭', 'إغلاق', 'Kapat'],
  ['pm.views', 'Project views', 'پروجیکٹ ویوز', 'Vistas del proyecto', 'Vues du projet', '项目视图', 'عروض المشروع', 'Proje görünümleri'],
  ['pm.open', 'Open {title}', '{title} کھولیں', 'Abrir {title}', 'Ouvrir {title}', '打开 {title}', 'افتح {title}', '{title} projesini aç'],
  ['pm.newtab', '{title}, opens in a new tab', '{title}، نئے ٹیب میں کھلتا ہے', '{title}, se abre en una pestaña nueva', "{title}, s'ouvre dans un nouvel onglet", '{title}，在新标签页打开', '{title}، يفتح في علامة تبويب جديدة', '{title}, yeni sekmede açılır'],
  ['pm.canvas', '3D model viewer. Drag to rotate, scroll to zoom.', 'تھری ڈی ماڈل ویور۔ گھمانے کے لیے ڈریگ کریں، زوم کے لیے اسکرول کریں۔', 'Visor de modelos 3D. Arrastra para girar, desplaza para acercar.', 'Visionneuse de modèles 3D. Faites glisser pour tourner, défilez pour zoomer.', '3D 模型查看器。拖动旋转，滚轮缩放。', 'عارض النماذج ثلاثية الأبعاد. اسحب للتدوير ومرّر للتكبير.', '3D model görüntüleyici. Döndürmek için sürükleyin, yakınlaştırmak için kaydırın.'],

  ['exp.eyebrow', '05 · Animation', '05 · اینیمیشن', '05 · Animación', '05 · Animation', '05 · 动画', '05 · الحركة', '05 · Animasyon'],
  ['exp.h2', 'Education and experience', 'تعلیم اور تجربہ', 'Educación y experiencia', 'Formation et expérience', '教育与经历', 'التعليم والخبرة', 'Eğitim ve deneyim'],
  ['exp.p', 'This is a dope sheet. Drag the playhead or press play, and the avatar acts out every keyframe.', 'یہ ایک ڈوپ شیٹ ہے۔ پلے ہیڈ کو کھینچیں یا پلے دبائیں، اور ایواٹار ہر کی فریم کو ادا کرے گا۔', 'Esto es una dope sheet. Arrastra el cabezal o pulsa reproducir y el avatar representará cada fotograma clave.', "Voici une dope sheet. Faites glisser la tête de lecture ou appuyez sur lecture, et l'avatar joue chaque image clé.", '这是一张摄影表（dope sheet）。拖动播放头或点击播放，角色就会演绎每一个关键帧。', 'هذه لوحة مفاتيح الحركة (dope sheet). اسحب مؤشر التشغيل أو اضغط تشغيل ليؤدي الأفاتار كل إطار رئيسي.', 'Bu bir dope sheet. Oynatma çubuğunu sürükleyin veya oynata basın; avatar her anahtar kareyi canlandırır.'],
  ['tl.play', 'Play', 'چلائیں', 'Reproducir', 'Lecture', '播放', 'تشغيل', 'Oynat'],
  ['tl.pause', 'Pause', 'روکیں', 'Pausar', 'Pause', '暂停', 'إيقاف مؤقت', 'Duraklat'],
  ['tl.hint', 'Scrub with the slider, or use arrow keys', 'سلائیڈر سے آگے پیچھے کریں، یا ایرو کیز استعمال کریں', 'Desplaza con el control o usa las flechas', 'Parcourez avec le curseur ou les flèches', '拖动滑块或使用方向键', 'استخدم المنزلق أو مفاتيح الأسهم', 'Kaydırıcıyı veya ok tuşlarını kullanın'],
  ['tl.aria', 'Timeline scrubber, drag to move through education and experience', 'ٹائم لائن سلائیڈر، تعلیم اور تجربے میں گھومنے کے لیے کھینچیں', 'Control de la línea de tiempo, arrastra para recorrer educación y experiencia', 'Curseur de la chronologie, faites glisser pour parcourir formation et expérience', '时间轴滑块，拖动以浏览教育与经历', 'منزلق الخط الزمني، اسحب للتنقل بين التعليم والخبرة', 'Zaman çizelgesi kaydırıcısı, eğitim ve deneyim arasında gezinmek için sürükleyin'],
  ['tl.jump', 'Jump to {t}', '{t} پر جائیں', 'Ir a {t}', 'Aller à {t}', '跳转到 {t}', 'انتقل إلى {t}', '{t} öğesine git'],
  ['ch.Education', 'Education', 'تعلیم', 'Educación', 'Formation', '教育', 'التعليم', 'Eğitim'],
  ['ch.Experience', 'Experience', 'تجربہ', 'Experiencia', 'Expérience', '经历', 'الخبرة', 'Deneyim'],
  ['tl.verify', 'Verify on Coursera', 'Coursera پر تصدیق کریں', 'Verificar en Coursera', 'Vérifier sur Coursera', '在 Coursera 上验证', 'تحقق على Coursera', "Coursera'da doğrula"],
  ['tl.olevels.short', 'O Levels', 'او لیولز', 'O Levels'],
  ['tl.olevels.title', 'O Levels', 'او لیولز', 'O Levels'],
  ['tl.olevels.text', 'Where the foundations were built before moving on to Intermediate.', 'جہاں انٹرمیڈیٹ میں جانے سے پہلے بنیادیں بنیں۔', 'Donde se construyeron las bases antes de pasar a Intermediate.', "Là où les bases ont été posées avant de passer à l'Intermediate.", '在升入 Intermediate 之前打下基础的阶段。', 'حيث بُنيت الأسس قبل الانتقال إلى مرحلة الإنترميديت.', "Intermediate'e geçmeden önce temellerin atıldığı yer."],
  ['tl.inter.short', 'Intermediate', 'انٹرمیڈیٹ', 'Intermediate', 'Intermediate', 'Intermediate', 'الإنترميديت', 'Intermediate'],
  ['tl.inter.title', 'Intermediate', 'انٹرمیڈیٹ', 'Intermediate', 'Intermediate', 'Intermediate', 'الإنترميديت', 'Intermediate'],
  ['tl.inter.text', 'Pre-university studies, and the point where computers and 3D became the plan.', 'جامعہ سے پہلے کی تعلیم، اور وہ موڑ جہاں کمپیوٹر اور تھری ڈی میرا منصوبہ بن گئے۔', 'Estudios preuniversitarios, y el momento en que los ordenadores y el 3D se volvieron el plan.', "Études préuniversitaires, et le moment où l'informatique et la 3D sont devenues le projet.", '大学预科阶段，也是计算机和 3D 成为我人生规划的起点。', 'الدراسة ما قبل الجامعية، واللحظة التي أصبح فيها الحاسوب والثلاثي الأبعاد هدفاً.', "Üniversite öncesi eğitim; bilgisayarların ve 3D'nin plana dönüştüğü an."],
  ['tl.ned.short', 'BS Computer Science', 'بی ایس کمپیوٹر سائنس', 'Licenciatura en Informática', 'Licence en informatique', '计算机科学学士', 'بكالوريوس علوم الحاسوب', 'Bilgisayar Bilimleri Lisans'],
  ['tl.ned.title', 'BS Computer Science', 'بی ایس کمپیوٹر سائنس', 'Licenciatura en Informática', 'Licence en informatique', '计算机科学学士', 'بكالوريوس علوم الحاسوب', 'Bilgisayar Bilimleri Lisans'],
  ['tl.ned.text', 'Specializing in Gaming and Animation: modelling, animation and game development alongside the core computer science degree.', 'گیمنگ اور اینیمیشن میں اسپیشلائزیشن: بنیادی کمپیوٹر سائنس ڈگری کے ساتھ ماڈلنگ، اینیمیشن اور گیم ڈویلپمنٹ۔', 'Especialidad en Videojuegos y Animación: modelado, animación y desarrollo de juegos junto con la carrera base de informática.', "Spécialisation en jeux vidéo et animation : modélisation, animation et développement de jeux en plus du cursus d'informatique.", '主修游戏与动画方向：在计算机科学核心课程之外学习建模、动画和游戏开发。', 'التخصص في الألعاب والرسوم المتحركة: النمذجة والتحريك وتطوير الألعاب إلى جانب درجة علوم الحاسوب الأساسية.', 'Oyun ve Animasyon uzmanlığı: temel bilgisayar bilimleri derecesinin yanında modelleme, animasyon ve oyun geliştirme.'],
  ['tl.blender.short', 'Blender'],
  ['tl.blender.title', '3D modelling and animation', 'تھری ڈی ماڈلنگ اور اینیمیشن', 'Modelado y animación 3D', 'Modélisation et animation 3D', '3D 建模与动画', 'النمذجة والتحريك ثلاثي الأبعاد', '3D modelleme ve animasyon'],
  ['tl.blender.text', 'Modelling and animating characters and environments in Blender, my main tool, and taking them through to game-ready assets.', 'اپنے بنیادی ٹول Blender میں کردار اور ماحول کی ماڈلنگ اور اینیمیشن، اور انہیں گیم کے لیے تیار اثاثوں تک پہنچانا۔', 'Modelado y animación de personajes y entornos en Blender, mi herramienta principal, hasta dejarlos como recursos listos para juego.', "Modélisation et animation de personnages et d'environnements dans Blender, mon outil principal, jusqu'à des assets prêts pour le jeu.", '在我的主力工具 Blender 中为角色和场景建模、制作动画，并一路做成可直接用于游戏的资源。', 'نمذجة وتحريك الشخصيات والبيئات في Blender، أداتي الرئيسية، وصولاً إلى أصول جاهزة للّعبة.', "Ana aracım Blender'da karakterleri ve ortamları modelleyip canlandırıyor, oyuna hazır varlıklara dönüştürüyorum."],
  ['tl.games.short', 'Game development', 'گیم ڈویلپمنٹ', 'Desarrollo de juegos', 'Développement de jeux', '游戏开发', 'تطوير الألعاب', 'Oyun geliştirme'],
  ['tl.games.title', 'Game development', 'گیم ڈویلپمنٹ', 'Desarrollo de juegos', 'Développement de jeux', '游戏开发', 'تطوير الألعاب', 'Oyun geliştirme'],
  ['tl.games.place', 'Unity and Unreal Engine', 'Unity اور Unreal Engine', 'Unity y Unreal Engine', 'Unity et Unreal Engine', 'Unity 与 Unreal Engine', 'Unity وUnreal Engine', 'Unity ve Unreal Engine'],
  ['tl.games.text', 'Worked in both engines and made games in each, from importing Blender assets to getting them running in a build.', 'دونوں انجنوں میں کام کیا اور دونوں میں گیمز بنائے، Blender اثاثے درآمد کرنے سے لے کر انہیں بلڈ میں چلانے تک۔', 'Trabajé en ambos motores y creé juegos en cada uno, desde importar recursos de Blender hasta ejecutarlos en una build.', "J'ai travaillé dans les deux moteurs et réalisé des jeux dans chacun, de l'import des assets Blender jusqu'à leur exécution dans un build.", '两个引擎都用过，并各做过游戏，从导入 Blender 资源到在构建版本中运行。', 'عملت في المحرّكين وصنعت ألعاباً في كل منهما، من استيراد أصول Blender إلى تشغيلها في نسخة مبنية.', 'Her iki motorda da çalıştım ve her birinde oyun yaptım; Blender varlıklarını içe aktarmaktan bir sürümde çalıştırmaya kadar.'],
  ['tl.cega.short', 'CEGA courses', 'CEGA کورسز', 'Cursos CEGA', 'Cours CEGA', 'CEGA 课程', 'دورات CEGA', 'CEGA kursları'],
  ['tl.cega.title', 'CEGA game development courses', 'CEGA گیم ڈویلپمنٹ کورسز', 'Cursos de desarrollo de juegos de CEGA', 'Cours de développement de jeux CEGA', 'CEGA 游戏开发课程', 'دورات CEGA لتطوير الألعاب', 'CEGA oyun geliştirme kursları'],
  ['tl.cega.place', 'Pre-production, Unreal and Post-production', 'پری پروڈکشن، انریل اور پوسٹ پروڈکشن', 'Preproducción, Unreal y Postproducción', 'Pré-production, Unreal et Post-production', '前期制作、Unreal 与后期制作', 'ما قبل الإنتاج وUnreal وما بعد الإنتاج', 'Ön yapım, Unreal ve Post prodüksiyon'],
  ['tl.cega.text', 'Completed three CEGA courses covering the game development pipeline: Pre-production, Unreal and Post-production.', 'CEGA کے تین کورسز مکمل کیے جو گیم ڈویلپمنٹ پائپ لائن کا احاطہ کرتے ہیں: پری پروڈکشن، انریل اور پوسٹ پروڈکشن۔', 'Completé tres cursos de CEGA que cubren el flujo de desarrollo de juegos: Preproducción, Unreal y Postproducción.', "J'ai suivi trois cours CEGA couvrant la chaîne de développement de jeux : pré-production, Unreal et post-production.", '完成了三门 CEGA 课程，涵盖游戏开发流程：前期制作、Unreal 和后期制作。', 'أنهيت ثلاث دورات من CEGA تغطي مسار تطوير الألعاب: ما قبل الإنتاج وUnreal وما بعد الإنتاج.', "Oyun geliştirme sürecini kapsayan üç CEGA kursunu tamamladım: Ön yapım, Unreal ve Post prodüksiyon."],
  ['tl.cert.short', 'Google AI cert', 'Google AI سرٹیفکیٹ', 'Cert. Google AI', 'Certif. Google AI', 'Google AI 证书', 'شهادة Google AI', 'Google AI sertifikası'],
  ['tl.cert.text', 'Seven courses on using AI for research, writing, content, data analysis and building apps.', 'تحقیق، تحریر، مواد، ڈیٹا تجزیے اور ایپس بنانے میں AI کے استعمال پر سات کورسز۔', 'Siete cursos sobre cómo usar la IA para investigar, escribir, crear contenido, analizar datos y crear aplicaciones.', "Sept cours sur l'usage de l'IA pour la recherche, la rédaction, le contenu, l'analyse de données et la création d'applications.", '七门课程，涵盖用 AI 进行研究、写作、内容创作、数据分析和应用开发。', 'سبع دورات حول استخدام الذكاء الاصطناعي في البحث والكتابة وصناعة المحتوى وتحليل البيانات وبناء التطبيقات.', 'Araştırma, yazma, içerik, veri analizi ve uygulama geliştirmede yapay zekâ kullanımına dair yedi kurs.'],

  ['contact.eyebrow', '06 · Export', '06 · ایکسپورٹ', '06 · Exportar', '06 · Export', '06 · 导出', '06 · التصدير', '06 · Dışa aktar'],
  ['contact.h2', "Let's make<br>something", 'آئیے کچھ<br>بنائیں', 'Hagamos<br>algo juntos', 'Créons<br>quelque chose', '一起<br>创造点什么', 'لنصنع<br>شيئاً معاً', 'Birlikte<br>bir şeyler yapalım'],
  ['contact.p', "Got a project, a collaboration or a job in mind? Send a message and I'll write back.", 'کوئی پروجیکٹ، تعاون یا نوکری ذہن میں ہے؟ پیغام بھیجیں، میں جواب دوں گا۔', '¿Tienes un proyecto, una colaboración o un trabajo en mente? Envía un mensaje y te responderé.', 'Un projet, une collaboration ou un poste en tête ? Envoyez un message, je vous répondrai.', '有项目、合作或工作机会吗？给我发消息，我会回复你。', 'هل لديك مشروع أو تعاون أو وظيفة في بالك؟ أرسل رسالة وسأردّ عليك.', "Aklında bir proje, işbirliği veya iş mi var? Mesaj gönder, geri döneceğim."],
  ['r.email', 'Email', 'ای میل', 'Correo', 'E-mail', '邮箱', 'البريد الإلكتروني', 'E-posta'],
  ['r.phone', 'Phone', 'فون', 'Teléfono', 'Téléphone', '电话', 'الهاتف', 'Telefon'],
  ['contact.wa', 'Chat on WhatsApp', 'واٹس ایپ پر چیٹ کریں', 'Chatea por WhatsApp', 'Discuter sur WhatsApp', '在 WhatsApp 上聊天', 'تحدّث عبر واتساب', "WhatsApp'ta yaz"],
  ['form.header', 'Export Message', 'پیغام ایکسپورٹ کریں', 'Exportar mensaje', 'Exporter le message', '导出消息', 'تصدير الرسالة', 'Mesajı dışa aktar'],
  ['f.name', 'Name', 'نام', 'Nombre', 'Nom', '姓名', 'الاسم', 'Ad'],
  ['f.email', 'Email', 'ای میل', 'Correo electrónico', 'E-mail', '邮箱', 'البريد الإلكتروني', 'E-posta'],
  ['f.subject', 'Subject', 'موضوع', 'Asunto', 'Objet', '主题', 'الموضوع', 'Konu'],
  ['f.message', 'Message', 'پیغام', 'Mensaje', 'Message', '消息', 'الرسالة', 'Mesaj'],
  ['form.ready', 'Ready to export.', 'ایکسپورٹ کے لیے تیار۔', 'Listo para exportar.', 'Prêt à exporter.', '准备导出。', 'جاهز للتصدير.', 'Dışa aktarmaya hazır.'],
  ['form.send', 'Send message', 'پیغام بھیجیں', 'Enviar mensaje', 'Envoyer le message', '发送消息', 'أرسل الرسالة', 'Mesajı gönder'],
  ['err.name', 'Enter your name.', 'اپنا نام درج کریں۔', 'Escribe tu nombre.', 'Saisissez votre nom.', '请输入姓名。', 'أدخل اسمك.', 'Adınızı girin.'],
  ['err.email', 'Enter a valid email address.', 'درست ای میل پتہ درج کریں۔', 'Introduce un correo válido.', 'Saisissez une adresse e-mail valide.', '请输入有效的邮箱地址。', 'أدخل بريداً إلكترونياً صحيحاً.', 'Geçerli bir e-posta adresi girin.'],
  ['err.subject', 'Add a short subject.', 'مختصر موضوع لکھیں۔', 'Añade un asunto breve.', 'Ajoutez un court objet.', '请填写简短的主题。', 'أضف موضوعاً قصيراً.', 'Kısa bir konu ekleyin.'],
  ['err.message', 'Write at least 10 characters.', 'کم از کم 10 حروف لکھیں۔', 'Escribe al menos 10 caracteres.', 'Écrivez au moins 10 caractères.', '请至少输入 10 个字符。', 'اكتب 10 أحرف على الأقل.', 'En az 10 karakter yazın.'],
  ['err.fix', 'Fix the highlighted fields.', 'نمایاں خانے درست کریں۔', 'Corrige los campos resaltados.', 'Corrigez les champs en surbrillance.', '请修正标出的字段。', 'صحّح الحقول المظللة.', 'Vurgulanan alanları düzeltin.'],
  ['form.sending', 'Exporting...', 'ایکسپورٹ ہو رہا ہے...', 'Exportando...', 'Export en cours...', '正在导出...', 'جارٍ التصدير...', 'Dışa aktarılıyor...'],
  ['form.ok', 'Export complete. Your message was sent, and I will reply soon.', 'ایکسپورٹ مکمل۔ آپ کا پیغام بھیج دیا گیا ہے، میں جلد جواب دوں گا۔', 'Exportación completa. Tu mensaje se envió y responderé pronto.', 'Export terminé. Votre message a été envoyé, je répondrai bientôt.', '导出完成。你的消息已发送，我会尽快回复。', 'اكتمل التصدير. تم إرسال رسالتك وسأردّ قريباً.', 'Dışa aktarma tamam. Mesajınız gönderildi, yakında yanıtlayacağım.'],
  ['form.rate', 'Too many attempts. Try again in a few minutes.', 'بہت زیادہ کوششیں۔ چند منٹ بعد دوبارہ کوشش کریں۔', 'Demasiados intentos. Inténtalo de nuevo en unos minutos.', 'Trop de tentatives. Réessayez dans quelques minutes.', '尝试次数过多，请几分钟后再试。', 'محاولات كثيرة. حاول مجدداً بعد دقائق.', 'Çok fazla deneme. Birkaç dakika sonra tekrar deneyin.'],
  ['form.wait', 'Please wait a moment, then press Send again.', 'ایک لمحہ انتظار کریں، پھر دوبارہ بھیجیں دبائیں۔', 'Espera un momento y vuelve a pulsar Enviar.', 'Patientez un instant, puis appuyez de nouveau sur Envoyer.', '请稍等片刻，然后再次点击发送。', 'انتظر لحظة ثم اضغط إرسال مرة أخرى.', "Bir an bekleyin, sonra tekrar Gönder'e basın."],
  ['form.offline', "Couldn't reach the server. Check your connection, or email me directly.", 'سرور تک رسائی نہیں ہو سکی۔ اپنا کنکشن چیک کریں، یا مجھے براہِ راست ای میل کریں۔', 'No se pudo conectar con el servidor. Revisa tu conexión o escríbeme directamente por correo.', 'Impossible de joindre le serveur. Vérifiez votre connexion ou écrivez-moi directement par e-mail.', '无法连接到服务器。请检查网络，或直接给我发邮件。', 'تعذّر الوصول إلى الخادم. تحقق من اتصالك أو راسلني مباشرة عبر البريد.', 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin veya bana doğrudan e-posta gönderin.'],
  ['form.fail', 'The message could not be sent. Try again, or email me directly.', 'پیغام نہیں بھیجا جا سکا۔ دوبارہ کوشش کریں یا مجھے براہ راست ای میل کریں۔', 'No se pudo enviar el mensaje. Inténtalo de nuevo o escríbeme directamente.', "Le message n'a pas pu être envoyé. Réessayez ou écrivez-moi directement.", '消息未能发送。请重试，或直接给我发邮件。', 'تعذّر إرسال الرسالة. حاول مجدداً أو راسلني مباشرة.', 'Mesaj gönderilemedi. Tekrar deneyin veya bana doğrudan e-posta gönderin.'],
  ['form.mailto', 'Mail sending is not switched on yet, so your email app is opening with the message ready. Press send there, or use the WhatsApp button.', 'میل بھیجنے کی سہولت ابھی آن نہیں ہے، اس لیے آپ کی ای میل ایپ پیغام کے ساتھ کھل رہی ہے۔ وہاں بھیجیں دبائیں، یا واٹس ایپ بٹن استعمال کریں۔', 'El envío de correo aún no está activado, así que tu app de correo se abre con el mensaje listo. Pulsa enviar allí o usa el botón de WhatsApp.', "L'envoi par e-mail n'est pas encore activé : votre application de messagerie s'ouvre avec le message prêt. Appuyez sur envoyer ou utilisez le bouton WhatsApp.", '邮件发送功能暂未开启，所以会打开你的邮件应用并填好内容。请在那里点击发送，或使用 WhatsApp 按钮。', 'إرسال البريد غير مفعّل بعد، لذا يُفتح تطبيق البريد لديك والرسالة جاهزة. اضغط إرسال هناك أو استخدم زر واتساب.', "E-posta gönderimi henüz açık değil; bu yüzden e-posta uygulamanız mesaj hazır olarak açılıyor. Orada gönder'e basın veya WhatsApp düğmesini kullanın."],
  ["f.search", "Search projects", "پروجیکٹس تلاش کریں", "Buscar proyectos", "Rechercher des projets", "搜索项目", "ابحث في المشاريع", "Projelerde ara"],
  ["f.searchph", "Search by name, tool or keyword", "نام، ٹول یا لفظ سے تلاش کریں", "Busca por nombre, herramienta o palabra", "Nom, outil ou mot-clé", "按名称、工具或关键词搜索", "ابحث بالاسم أو الأداة أو كلمة", "Ad, araç veya anahtar kelime"],
  ["f.tag", "Technique", "تکنیک", "Técnica", "Technique", "技术", "التقنية", "Teknik"],
  ["f.alltags", "All techniques", "تمام تکنیکیں", "Todas las técnicas", "Toutes les techniques", "全部技术", "كل التقنيات", "Tüm teknikler"],
  ["pm.playvideo", "Play video: {title}", "ویڈیو چلائیں: {title}", "Reproducir vídeo: {title}", "Lire la vidéo : {title}", "播放视频：{title}", "تشغيل الفيديو: {title}", "Videoyu oynat: {title}"],
  ["v.play", "Play", "چلائیں", "Reproducir", "Lecture", "播放", "تشغيل", "Oynat"],
  ["v.pause", "Pause", "روکیں", "Pausar", "Pause", "暂停", "إيقاف مؤقت", "Duraklat"],
  ["v.mute", "Mute", "خاموش کریں", "Silenciar", "Couper le son", "静音", "كتم الصوت", "Sesi kapat"],
  ["v.unmute", "Unmute", "آواز چلائیں", "Activar sonido", "Activer le son", "取消静音", "إلغاء الكتم", "Sesi aç"],
  ["v.full", "Full screen", "فل اسکرین", "Pantalla completa", "Plein écran", "全屏", "ملء الشاشة", "Tam ekran"],
  ["v.seek", "Seek in video", "ویڈیو میں آگے پیچھے جائیں", "Buscar en el vídeo", "Parcourir la vidéo", "拖动视频进度", "التنقل في الفيديو", "Videoda ilerle"],
  ["f.count", "Showing {n} of {total} projects", "{total} میں سے {n} پروجیکٹس", "Mostrando {n} de {total} proyectos", "{n} projets sur {total}", "显示 {n} / {total} 个项目", "عرض {n} من {total} مشروعًا", "{total} projeden {n} tanesi gösteriliyor"],
  ["f.none", "No projects match your search.", "آپ کی تلاش سے کوئی پروجیکٹ مطابقت نہیں رکھتا۔", "Ningún proyecto coincide con tu búsqueda.", "Aucun projet ne correspond à votre recherche.", "没有符合搜索条件的项目。", "لا توجد مشاريع تطابق بحثك.", "Aramanızla eşleşen proje yok."],
  ["f.clear", "Clear filters", "فلٹرز صاف کریں", "Borrar filtros", "Effacer les filtres", "清除筛选", "مسح التصفية", "Filtreleri temizle"],
  ["chat.open", "Ask the AI assistant", "اے آئی اسسٹنٹ سے پوچھیں", "Preguntar al asistente de IA", "Interroger l’assistant IA", "向 AI 助手提问", "اسأل مساعد الذكاء الاصطناعي", "Yapay zekâ asistanına sor"],
  ["chat.fab", "Ask AI", "اے آئی سے پوچھیں", "Pregunta a la IA", "Demander à l’IA", "问 AI", "اسأل الذكاء", "Yapay zekâya sor"],
  ["chat.title", "Ask about Hasan", "حسن کے بارے میں پوچھیں", "Pregunta sobre Hasan", "Posez une question sur Hasan", "关于 Hasan 的提问", "اسأل عن حسن", "Hasan hakkında sorun"],
  ["chat.sub", "AI assistant. Answers come from his CV and projects.", "اے آئی اسسٹنٹ۔ جوابات ان کے سی وی اور پروجیکٹس سے آتے ہیں۔", "Asistente de IA. Responde con su CV y sus proyectos.", "Assistant IA. Les réponses viennent de son CV et de ses projets.", "AI 助手。回答来自他的简历和项目。", "مساعد ذكاء اصطناعي. الإجابات من سيرته الذاتية ومشاريعه.", "Yapay zekâ asistanı. Yanıtlar özgeçmişinden ve projelerinden gelir."],
  ["chat.close", "Close chat", "چیٹ بند کریں", "Cerrar el chat", "Fermer le chat", "关闭聊天", "إغلاق المحادثة", "Sohbeti kapat"],
  ["chat.label", "Your question", "آپ کا سوال", "Tu pregunta", "Votre question", "你的问题", "سؤالك", "Sorunuz"],
  ["chat.ph", "Ask about skills, projects or education", "مہارتوں، پروجیکٹس یا تعلیم کے بارے میں پوچھیں", "Pregunta por habilidades, proyectos o estudios", "Compétences, projets ou études", "询问技能、项目或教育背景", "اسأل عن المهارات أو المشاريع أو التعليم", "Yetenekler, projeler veya eğitim hakkında sorun"],
  ["chat.send", "Send", "بھیجیں", "Enviar", "Envoyer", "发送", "إرسال", "Gönder"],
  ["chat.hello", "Hi! I can answer questions about Hasan’s skills, projects, education and how to contact him.", "السلام علیکم! میں حسن کی مہارتوں، پروجیکٹس، تعلیم اور رابطے کے بارے میں سوالات کے جواب دے سکتا ہوں۔", "¡Hola! Puedo responder preguntas sobre las habilidades, los proyectos y los estudios de Hasan, y cómo contactarlo.", "Bonjour ! Je peux répondre à vos questions sur les compétences, les projets et les études de Hasan, et sur la façon de le contacter.", "你好！我可以回答关于 Hasan 的技能、项目、教育背景以及联系方式的问题。", "مرحبًا! يمكنني الإجابة عن أسئلة حول مهارات حسن ومشاريعه ودراسته وطريقة التواصل معه.", "Merhaba! Hasan’ın yetenekleri, projeleri, eğitimi ve ona nasıl ulaşılacağı hakkındaki soruları yanıtlayabilirim."],
  ["chat.s1", "What projects has Hasan built?", "حسن نے کون سے پروجیکٹس بنائے ہیں؟", "¿Qué proyectos ha creado Hasan?", "Quels projets Hasan a-t-il réalisés ?", "Hasan 做过哪些项目？", "ما المشاريع التي أنجزها حسن؟", "Hasan hangi projeleri yaptı?"],
  ["chat.s2", "Which tools and skills does he use?", "وہ کون سے ٹولز اور مہارتیں استعمال کرتے ہیں؟", "¿Qué herramientas y habilidades usa?", "Quels outils et compétences utilise-t-il ?", "他使用哪些工具和技能？", "ما الأدوات والمهارات التي يستخدمها؟", "Hangi araçları ve becerileri kullanıyor?"],
  ["chat.s3", "What is he studying?", "وہ کیا پڑھ رہے ہیں؟", "¿Qué está estudiando?", "Qu’étudie-t-il ?", "他在学什么？", "ماذا يدرس؟", "Ne okuyor?"],
  ["chat.s4", "How can I contact him?", "میں ان سے کیسے رابطہ کروں؟", "¿Cómo puedo contactarlo?", "Comment le contacter ?", "我怎样联系他？", "كيف أتواصل معه؟", "Ona nasıl ulaşabilirim?"],
  ["chat.note", "Answers come only from Hasan’s CV and portfolio and can be wrong. For anything else, use the contact form.", "جوابات صرف حسن کے سی وی اور پورٹ فولیو سے آتے ہیں اور غلط ہو سکتے ہیں۔ کسی اور بات کے لیے رابطہ فارم استعمال کریں۔", "Las respuestas vienen solo del CV y el portafolio de Hasan y pueden ser incorrectas. Para otras cosas, usa el formulario de contacto.", "Les réponses viennent uniquement du CV et du portfolio de Hasan et peuvent être inexactes. Pour tout autre sujet, utilisez le formulaire de contact.", "回答仅来自 Hasan 的简历和作品集，可能有误。其他问题请使用联系表单。", "الإجابات من السيرة الذاتية ومعرض أعمال حسن فقط وقد تكون خاطئة. لأي أمر آخر استخدم نموذج التواصل.", "Yanıtlar yalnızca Hasan’ın özgeçmişinden ve portfolyosundan gelir ve yanlış olabilir. Başka konular için iletişim formunu kullanın."],
  ["chat.thinking", "Looking through the portfolio…", "پورٹ فولیو میں دیکھ رہا ہوں…", "Buscando en el portafolio…", "Je consulte le portfolio…", "正在查阅作品集…", "أبحث في معرض الأعمال…", "Portfolyoya bakıyorum…"],
  ["chat.error", "Couldn’t reach the assistant. Please try again, or use the contact form.", "اسسٹنٹ تک رسائی نہیں ہو سکی۔ دوبارہ کوشش کریں، یا رابطہ فارم استعمال کریں۔", "No se pudo contactar con el asistente. Inténtalo de nuevo o usa el formulario de contacto.", "Impossible de joindre l’assistant. Réessayez ou utilisez le formulaire de contact.", "无法连接到助手。请重试，或使用联系表单。", "تعذّر الوصول إلى المساعد. حاول مرة أخرى أو استخدم نموذج التواصل.", "Asistana ulaşılamadı. Lütfen tekrar deneyin veya iletişim formunu kullanın."],
  ["chat.rate", "Too many questions in a short time. Please try again in a few minutes.", "مختصر وقت میں بہت زیادہ سوالات۔ چند منٹ بعد دوبارہ کوشش کریں۔", "Demasiadas preguntas en poco tiempo. Inténtalo de nuevo en unos minutos.", "Trop de questions en peu de temps. Réessayez dans quelques minutes.", "短时间内提问过多，请几分钟后再试。", "أسئلة كثيرة في وقت قصير. حاول مرة أخرى بعد بضع دقائق.", "Kısa sürede çok fazla soru. Birkaç dakika sonra tekrar deneyin."],
  ["chat.unavailable", "The assistant is not available right now. Please use the contact form.", "اسسٹنٹ ابھی دستیاب نہیں ہے۔ رابطہ فارم استعمال کریں۔", "El asistente no está disponible ahora. Usa el formulario de contacto.", "L’assistant n’est pas disponible pour le moment. Utilisez le formulaire de contact.", "助手暂时不可用。请使用联系表单。", "المساعد غير متاح الآن. استخدم نموذج التواصل.", "Asistan şu anda kullanılamıyor. Lütfen iletişim formunu kullanın."],
  ["chat.source", "Source", "ماخذ", "Fuente", "Source", "来源", "المصدر", "Kaynak"],
  ["chat.you", "You", "آپ", "Tú", "Vous", "你", "أنت", "Siz"],
  ['form.privacy', 'Your name, email and message are used only to send this email to Hasan through Brevo. This site does not store them. Questions to the assistant are processed by Google Gemini.', 'آپ کا نام، ای میل اور پیغام صرف حسن کو یہ ای میل Brevo کے ذریعے بھیجنے کے لیے استعمال ہوتے ہیں۔ یہ سائٹ انہیں محفوظ نہیں کرتی۔ اسسٹنٹ سے پوچھے گئے سوالات Google Gemini پر پروسیس ہوتے ہیں۔', 'Tu nombre, correo y mensaje se usan solo para enviar este correo a Hasan mediante Brevo. Este sitio no los almacena. Las preguntas al asistente las procesa Google Gemini.', 'Votre nom, e-mail et message servent uniquement à envoyer ce courriel à Hasan via Brevo. Ce site ne les conserve pas. Les questions à l’assistant sont traitées par Google Gemini.', '你的姓名、邮箱和留言仅用于通过 Brevo 将这封邮件发送给 Hasan，本网站不会保存。向助手提出的问题由 Google Gemini 处理。', 'يُستخدم اسمك وبريدك ورسالتك فقط لإرسال هذه الرسالة إلى حسن عبر Brevo، ولا يخزنها هذا الموقع. تتم معالجة أسئلة المساعد بواسطة Google Gemini.', 'Adınız, e-postanız ve mesajınız yalnızca bu e-postayı Brevo aracılığıyla Hasan’a göndermek için kullanılır. Bu site bunları saklamaz. Asistana sorulan sorular Google Gemini tarafından işlenir.'],
  ['foot.rights', 'All rights reserved.', 'جملہ حقوق محفوظ ہیں۔', 'Todos los derechos reservados.', 'Tous droits réservés.', '保留所有权利。', 'جميع الحقوق محفوظة.', 'Tüm hakları saklıdır.'],
  ['foot.legal', 'Apple, MacBook and AirPods are trademarks of Apple Inc. The related models are independent fan-made studies, not affiliated with or endorsed by Apple. Built with Three.js (MIT licence).'],
  ['noscript', 'This portfolio uses 3D graphics and needs JavaScript. You can still email hasan.x.abbasi@gmail.com.', 'یہ پورٹ فولیو تھری ڈی گرافکس استعمال کرتا ہے اور جاوا اسکرپٹ چاہتا ہے۔ آپ پھر بھی hasan.x.abbasi@gmail.com پر ای میل کر سکتے ہیں۔', 'Este portafolio usa gráficos 3D y necesita JavaScript. Aún puedes escribir a hasan.x.abbasi@gmail.com.', 'Ce portfolio utilise des graphismes 3D et nécessite JavaScript. Vous pouvez toujours écrire à hasan.x.abbasi@gmail.com.', '此作品集使用 3D 图形，需要 JavaScript。你仍可发邮件到 hasan.x.abbasi@gmail.com。', 'يستخدم هذا الموقع رسومات ثلاثية الأبعاد ويحتاج إلى JavaScript. ما زال بإمكانك مراسلة hasan.x.abbasi@gmail.com.', 'Bu portfolyo 3D grafik kullanır ve JavaScript gerektirir. Yine de hasan.x.abbasi@gmail.com adresine e-posta gönderebilirsiniz.'],

  ['theme.toggle', 'Switch theme', 'تھیم تبدیل کریں', 'Cambiar tema', 'Changer de thème', '切换主题', 'تبديل المظهر', 'Temayı değiştir'],
  ['theme.light', 'Switch to light theme', 'لائٹ تھیم پر جائیں', 'Cambiar a tema claro', 'Passer au thème clair', '切换到浅色主题', 'التبديل إلى المظهر الفاتح', 'Açık temaya geç'],
  ['theme.dark', 'Switch to dark theme', 'ڈارک تھیم پر جائیں', 'Cambiar a tema oscuro', 'Passer au thème sombre', '切换到深色主题', 'التبديل إلى المظهر الداكن', 'Koyu temaya geç'],
  ['lang.label', 'Language', 'زبان', 'Idioma', 'Langue', '语言', 'اللغة', 'Dil'],
  ['cmd.open', 'Quick menu (K)', 'فوری مینو (K)', 'Menú rápido (K)', 'Menu rapide (K)', '快捷菜单 (K)', 'القائمة السريعة (K)', 'Hızlı menü (K)'],
  ['cmd.title', 'Quick menu', 'فوری مینو', 'Menú rápido', 'Menu rapide', '快捷菜单', 'القائمة السريعة', 'Hızlı menü'],
  ['cmd.ph', 'Type to search, or pick a command', 'تلاش کے لیے لکھیں، یا کوئی کمانڈ چنیں', 'Escribe para buscar o elige un comando', 'Tapez pour rechercher ou choisissez une commande', '输入搜索，或选择一个命令', 'اكتب للبحث أو اختر أمراً', 'Aramak için yazın veya bir komut seçin'],
  ['cmd.none', 'Nothing matches', 'کچھ نہیں ملا', 'Sin resultados', 'Aucun résultat', '没有匹配项', 'لا توجد نتائج', 'Eşleşme yok'],
  ['cmd.keys', '↑↓ move · Enter open · Esc close', '↑↓ حرکت · Enter کھولیں · Esc بند', '↑↓ mover · Enter abrir · Esc cerrar', '↑↓ naviguer · Entrée ouvrir · Échap fermer', '↑↓ 移动 · Enter 打开 · Esc 关闭', '↑↓ تنقّل · Enter فتح · Esc إغلاق', '↑↓ gezin · Enter aç · Esc kapat'],
  ['cmd.sections', 'Go to', 'جائیں', 'Ir a', 'Aller à', '前往', 'انتقل إلى', 'Git'],
  ['cmd.actions', 'Actions', 'کارروائیاں', 'Acciones', 'Actions', '操作', 'إجراءات', 'Eylemler'],
  ['cmd.projects', 'Projects', 'پروجیکٹس', 'Proyectos', 'Projets', '项目', 'المشاريع', 'Projeler'],
  ['cmd.lang', 'Language', 'زبان', 'Idioma', 'Langue', '语言', 'اللغة', 'Dil'],
  ['act.email', 'Send email', 'ای میل بھیجیں', 'Enviar correo', 'Envoyer un e-mail', '发送邮件', 'إرسال بريد', 'E-posta gönder'],
  ['act.github', 'Open GitHub', 'GitHub کھولیں', 'Abrir GitHub', 'Ouvrir GitHub', '打开 GitHub', 'افتح GitHub', "GitHub'ı aç"],
  ['act.linkedin', 'Open LinkedIn', 'LinkedIn کھولیں', 'Abrir LinkedIn', 'Ouvrir LinkedIn', '打开 LinkedIn', 'افتح LinkedIn', "LinkedIn'i aç"],
];

const DICT = {};
ORDER.forEach((c) => (DICT[c] = {}));
ROWS.forEach(([key, ...vals]) => {
  ORDER.forEach((c, i) => {
    // A row with fewer values than languages falls back to English for the missing ones.
    DICT[c][key] = vals[i] != null ? vals[i] : vals[0];
  });
});

let cur = 'en';
const FONT_URLS = {
  ar: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&display=swap',
  zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap',
};
FONT_URLS.ur = FONT_URLS.ar;

export const getLang = () => cur;
export const isRtl = () => !!(LANGS.find((l) => l.code === cur) || {}).rtl;

export function t(key, vars) {
  let s = (DICT[cur] && DICT[cur][key]) ?? DICT.en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
  return s;
}
// Like t(), but returns `fallback` when the key does not exist at all.
export function tr(key, fallback, vars) {
  const has = DICT.en[key] !== undefined;
  return has ? t(key, vars) : fallback;
}

export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}

function loadFont(code) {
  const url = FONT_URLS[code];
  if (!url || document.querySelector(`link[data-lang-font="${url}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = url;
  l.dataset.langFont = url;
  document.head.appendChild(l);
}

export function setLang(code, persist = true) {
  if (!DICT[code]) code = 'en';
  cur = code;
  const h = document.documentElement;
  h.lang = code;
  h.classList.toggle('rtl', isRtl());
  h.dir = isRtl() ? 'rtl' : 'ltr';
  loadFont(code);
  document.title = t('meta.title');
  applyDom();
  if (persist) { try { localStorage.setItem('lang', code); } catch { /* storage blocked */ } }
  window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
}

export function initialLang() {
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch { /* storage blocked */ }
  if (saved && DICT[saved]) return saved;
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return DICT[nav] ? nav : 'en';
}
