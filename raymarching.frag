#version 300 es

//ENGINE CONSTANTS
#define INF 			1e27
#define MAX_LIST_SIZE 	32

#define MAX_STEPS 	128
#define MAX_DIST 	250.0
#define EPS_DIST 	0.01
#define EPS_NORMAL 	0.001

#define SHADOW_CIRCUIT 	0.5
#define SHADOW_HARDNESS 7.f

//MATH CONSTANTS
#define PI			3.1415926535
#define SQRT2 		1.41421356237
#define INVSQRT2 	0.70710678118
#define SMOOTH_KOEF 1.f
#define TETRAHEDRON vec2(1.f, -1.f)

//COLORS
#define RED				vec3(1.,0.,0.)
#define GREEN			vec3(0.,1.,0.)
#define BLUE			vec3(0.,0.,1.)
#define VOID 			vec3(0.01f,0.01f,0.05f)
#define GLASS_COLOR 	vec3(0.05)
#define GLICERINE_COLOR vec3(0.05,0.05,0.f)
#define WAX_COLOR 		vec3(1.f, 0.5, 0.05f)
//vec3(1.f, 0.86275, 0.52157)

//PHYSICS CONSTANTS
#define GLASS_REFRACTIVE_INDEX 		1.52
#define AIR_REFRACTIVE_INDEX 		1.000293
#define GLICERINE_REFRACTIVE_INDEX 	1.47399

#define AIR2GLASS_REFRACTIVE 		AIR_REFRACTIVE_INDEX/GLASS_REFRACTIVE_INDEX
#define GLASS2AIR_REFRACTIVE 		GLASS_REFRACTIVE_INDEX/AIR_REFRACTIVE_INDEX
#define GLICERINE2GLASS_REFRACTIVE 	GLICERINE_REFRACTIVE_INDEX/GLASS_REFRACTIVE_INDEX
#define GLASS2GLICERINE_REFRACTIVE 	GLASS_REFRACTIVE_INDEX/GLICERINE_REFRACTIVE_INDEX

//SCENE CONSTANTS
#define LIGHT_POS 		vec3(0.f, 0.f, 0.f)
#define LIGHT_COL 		vec3(1.f, 1.f, 1.f)
#define LIGHT_POWER 	10.f
#define SCATTERED_LIGHT 7.f

#define RING_THIGHT_RADIUS 	1.5f
#define SPIRAL1_RADIUS 		4.f
#define SPIRAL2_RADIUS 		3.f

precision mediump float;

struct Particle {
	vec3 pos;
	float radius;
};
struct ParticleList {
	uint len;
	Particle a[MAX_LIST_SIZE];
};
struct TwoDimList {
	uint len;
	ParticleList a[MAX_LIST_SIZE];
};

uniform vec3 u_cameraPosition;
uniform uint u_debugMode;
uniform vec2 u_flask; // s - size, t - thickness, center = vec3(0.f)
uniform vec3 u_scattLightPos;
uniform ParticleList u_bubles;

in vec3 v_ray_direction;
out vec4 out_fragColor;


//MATH FUNCTONS
float smoothmin(float a, float b, float k){
	return -log2(exp2(-k*a)+exp2(-k*b))/k;
}

// SDF's
float sdSphere(in vec3 point, in float radius){
	return length(point) - radius;//sphere.w - radius
}

float sdFlask(in vec3 point){
	return abs(sdSphere(point, u_flask.s)) - u_flask.t;
}

float sdFlaskEdgeCenter(in vec3 point){
	return sdSphere(point, u_flask.s);
}

float sdFloor(in vec3 point){
	return point.y + INVSQRT2*(
		u_flask.s+
		u_flask.t+
		RING_THIGHT_RADIUS+
		SPIRAL1_RADIUS*2.f+
		SPIRAL2_RADIUS ) + SPIRAL2_RADIUS + RING_THIGHT_RADIUS;
}

float sdKnees(in vec3 point){
	point.xz = abs(point.xz);
	point.xz = point.x < point.z ? point.zx : point.xz;
	float r = INVSQRT2*(u_flask.s + u_flask.t + RING_THIGHT_RADIUS);
	float spiral1_c = INVSQRT2*(u_flask.s + u_flask.t + RING_THIGHT_RADIUS + SPIRAL1_RADIUS);

	vec2 scP8 = vec2(sin(PI*3.f/4.f), cos(PI*3.f/4.f));
	vec2 tpoint = vec2( abs(spiral1_c - point.x), spiral1_c + point.y);
	float k = (scP8.y*tpoint.x>scP8.x*tpoint.y) ? dot(tpoint, scP8) : length(tpoint);
	float spiral1 = length(
		vec2(
			sqrt(
				dot(tpoint, tpoint) + SPIRAL1_RADIUS*SPIRAL1_RADIUS - 2.f*SPIRAL1_RADIUS*k
			),
			point.z
		)
	) - RING_THIGHT_RADIUS;

	float spiral2_c = INVSQRT2*(u_flask.s + u_flask.t + RING_THIGHT_RADIUS + SPIRAL1_RADIUS*2.f + SPIRAL2_RADIUS);
	scP8 = vec2(sin(PI*1.f/4.f), cos(PI*1.f/4.f));
	tpoint = vec2( spiral2_c - point.x, spiral2_c + point.y);
	tpoint.x = abs(tpoint.x);
	k = (scP8.y*tpoint.x<scP8.x*tpoint.y) ? dot(tpoint, scP8) : length(tpoint);
	float spiral2 = length(
		vec2(
			sqrt(
				dot(tpoint, tpoint) + SPIRAL2_RADIUS*SPIRAL2_RADIUS - 2.f*SPIRAL2_RADIUS*k
			),
			point.z
		)
	) - RING_THIGHT_RADIUS;
	return min(spiral1, spiral2);
}

float sdRing(in vec3 point){
	float r = INVSQRT2*(u_flask.s + u_flask.t + RING_THIGHT_RADIUS);
	return length(vec2(length(point.xz) - r, r + point.y)) - RING_THIGHT_RADIUS;
}

float sdStand(in vec3 point){
	return min(
		sdKnees(point),
		sdRing(point)
	);
}

float sdDecorations(in vec3 point){
	return min(sdFloor(point), sdStand(point));
}

float sdWax(in vec3 point){
	float dist = INF;
	//float n_dist;

	//for(uint i=0u; i<u_bubles.len; i++){
	float exp_sum = 0.f;
	for(uint j=0u; j<u_bubles.len; j++){
		exp_sum += exp2(-SMOOTH_KOEF * sdSphere(point - u_bubles.a[j].pos, u_bubles.a[j].radius));
	}
	dist = min(dist, -log2(exp_sum)/SMOOTH_KOEF);//*/
	//}
	return dist;
}

float sdAll(in vec3 point){
	return //min(sdLight
		min(sdFlask(point), sdWax(point));
}

float sdOutWorld(in vec3 point){
	return min(
		sdFlask(point),
		sdDecorations(point)
	);
}

//NORMALS
vec3 getNormal(in vec3 point){
	//TETRAHEDRON METHOD
	return normalize(
		TETRAHEDRON.xyy*sdAll( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*sdAll( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*sdAll( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*sdAll( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}
vec3 getNormal_Flask(in vec3 point){
	return normalize(
		TETRAHEDRON.xyy*sdFlask( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*sdFlask( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*sdFlask( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*sdFlask( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}
vec3 getNormal_InFlask(in vec3 point){
	return normalize(
		TETRAHEDRON.xyy*-sdFlask( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*-sdFlask( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*-sdFlask( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*-sdFlask( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}
vec3 getNormal_Wax(in vec3 point){
	return normalize(
		TETRAHEDRON.xyy*sdWax( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*sdWax( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*sdWax( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*sdWax( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}
vec3 getNormal_InWax(in vec3 point){
	return normalize(
		TETRAHEDRON.xyy*-sdWax( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*-sdWax( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*-sdWax( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*-sdWax( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}
vec3 getNormal_Decorations(in vec3 point){
	return normalize(
		TETRAHEDRON.xyy*sdDecorations( point + TETRAHEDRON.xyy*EPS_NORMAL ) +
		TETRAHEDRON.yyx*sdDecorations( point + TETRAHEDRON.yyx*EPS_NORMAL ) +
		TETRAHEDRON.yxy*sdDecorations( point + TETRAHEDRON.yxy*EPS_NORMAL ) +
		TETRAHEDRON.xxx*sdDecorations( point + TETRAHEDRON.xxx*EPS_NORMAL )
	);
}

//RAYS
vec4 RayMarch(in vec3 ro, in vec3 rd, out bool full_end){
	/*
	RayMarch + info about march (steps, ) + info about break the cicle
	*/
    float r_dist = 0.;
	float step = 0.;
	vec3 point = vec3(ro);

    for(int i=0; i<MAX_STEPS; i++){
		point = ro + rd*r_dist;
		step = sdAll(point);
		r_dist += step;
		if(abs(step) < EPS_DIST){
			full_end = true;
			return vec4(point, r_dist);
		}
		if(r_dist > MAX_DIST){
			full_end = false;
			return vec4(point, r_dist);
		}
	}
	full_end = false;
	return vec4(point, r_dist);
}

vec4 RayOutFlask(in vec3 ro, in vec3 rd, out bool is_flask){
	/*
	RayMarch + intersect with flask
	*/
	float r_dist = 0.;
	float step = 0.;
	vec3 point;
	is_flask = false;

	for(int i=0; i<MAX_STEPS; i++){
		point = ro + rd*r_dist;
		step = sdOutWorld(point);
		r_dist += step;
		if(abs(step) < EPS_DIST || r_dist > MAX_DIST){
			break;
		}
	}

	point = ro + rd*r_dist;
	if(sdFlask(point) < sdDecorations(point)){
		is_flask = true;
	}
	return vec4(point, r_dist);
}

vec4 RayInFlask(in vec3 ro, in vec3 rd, out bool is_inner){
	/*
	RayMarch in glass of flask + info about intersect inner side of flask
	*/
	float r_dist = 0.;
	float step = 0.;
	vec3 point;

	for(int i=0; i < MAX_STEPS; i++){
		point = ro + rd*r_dist;
		step = -sdFlask(point);
		r_dist += step;
		if(abs(step) < EPS_DIST) break;
	}

	point = ro + rd*r_dist;
	is_inner = (sdFlaskEdgeCenter(point) < 0.f);
	return vec4(point, r_dist);
}

vec4 RayWax(in vec3 ro, in vec3 rd, out bool is_wax){
   /*
   RayMarch + info about march (steps, ) + info about intersect with wax
   */
   float r_dist = 0.f;
   float step = 0.f;
   vec3 point;
   is_wax = false;

   for(int i=0; i < MAX_STEPS; i++){
	   point = ro + rd*r_dist;
	   step = sdWax(point);
	   r_dist += step;
	   if(abs(step) < EPS_DIST){
		   is_wax = true;
		   break;
	   }
	   if(r_dist > MAX_DIST){
		   break;
	   }
   }
   point = ro + rd*r_dist;
   return vec4(point, r_dist);
}

vec4 RayWaxShadow(in vec3 ro, in vec3 rd, in float max_dist, out float shadow){
	float r_dist = 0.f;
	float prevStep = INF;
	float step = 0.f;
	vec3 point;
	shadow = 1.f;

	for(int i=0; i < MAX_STEPS; i++){
		point = ro + rd*r_dist;
		step = sdWax(point) + SHADOW_CIRCUIT;

		//calc smooth shadow
		float deltaStep = step*step/(2.*prevStep);
		float height = sqrt(step*step - deltaStep*deltaStep);
		shadow = min(shadow, 20.*height/max(0.,r_dist-deltaStep));

		prevStep = step;
		r_dist += step;
		if(abs(step) < EPS_DIST || r_dist > max_dist){
		    break;
		}
	}

	shadow = r_dist < max_dist ? 0.f : shadow;
	r_dist = min(r_dist, max_dist);
	point = ro + rd*r_dist;
	return vec4(point, r_dist);
}

vec4 RayInWax_SSS(in vec3 ro, in vec3 rd, in float max_dist, out float SSS_koef){
   /*
   RayMarch + info about march (steps, ) + info about intersect with wax
   */
   float r_dist = 0.f;
   float step = 0.f;
   vec3 point;

   for(int i=0; i < MAX_STEPS; i++){
	   point = ro + rd*r_dist;
	   step = -sdWax(point);
	   r_dist += step;
	   if(abs(step) < EPS_DIST || r_dist > max_dist){
		   break;
	   }
   }

   r_dist = min(r_dist, max_dist);
   point = ro + rd*r_dist;
   SSS_koef = exp(-0.07*r_dist);
   return vec4(point, r_dist);
}

vec4 RayDecor(in vec3 ro, in vec3 rd, out bool is_decor){
   /*
   RayMarch + info about march (steps, ) + info about intersect with wax
   */
   float r_dist = 0.f;
   float step = 0.f;
   vec3 point;
   is_decor = false;

   for(int i=0; i < MAX_STEPS; i++){
	   point = ro + rd*r_dist;
	   step = sdDecorations(point);
	   r_dist += step;
	   if(abs(step) < EPS_DIST){
		   is_decor = true;
		   break;
	   }
	   if(r_dist > MAX_DIST){
		   break;
	   }
   }
   point = ro + rd*r_dist;
   return vec4(point, r_dist);
}

vec4 RayDecorShadow(in vec3 ro, in vec3 rd, in float max_dist, out float shadow){
	float r_dist = 0.f;
	float prevStep = INF;
	float step = 0.f;
	vec3 point;
	shadow = 1.f;

	for(int i=0; i < MAX_STEPS; i++){
		point = ro + rd*r_dist;
		step = sdDecorations(point) + SHADOW_CIRCUIT;

		//calc smooth shadow
		float deltaStep = step*step/(2.*prevStep);
		float height = sqrt(step*step - deltaStep*deltaStep);
		shadow = min(shadow, SHADOW_HARDNESS*height/max(0.,r_dist-deltaStep));

		prevStep = step;
		r_dist += step;
		if(abs(step) < EPS_DIST || r_dist > max_dist){
		    break;
		}
	}

	shadow = r_dist < max_dist ? 0.f : shadow;
	r_dist = min(r_dist, max_dist);
	point = ro + rd*r_dist;
	return vec4(point, r_dist);
}

vec4 RayAll(in vec3 ro, in vec3 rd, out bool is_wax){
   /*
   RayMarch + info about march (steps, ) + info about intersect with wax
   */
   float r_dist = 0.;
   float step = 0.;
   vec3 point;
   is_wax = false;

   for(int i=0; i < MAX_STEPS; i++){
	   point = ro + rd*r_dist;
	   step = sdAll(point);
	   r_dist += step;
	   if(abs(step) < EPS_DIST || r_dist > MAX_DIST){
		   break;
	   }
   }
   point = ro + rd*r_dist;
   if(sdWax(point)<sdFlask(point)){
	   is_wax = true;
   }
   return vec4(point, r_dist);
}

// RENDER
vec3 getWaxColor(in vec3 point, in vec3 normal){
	vec3 ray_origin = point - 4.*EPS_DIST*normal;
	vec3 ray_direction = normalize(LIGHT_POS - ray_origin);
	float lightInPoint = LIGHT_POWER;
	float dist_to_light = distance(LIGHT_POS, ray_origin);
	float SSS;

	vec4 march_result = RayInWax_SSS(ray_origin, ray_direction, dist_to_light, SSS);
	lightInPoint = max(SCATTERED_LIGHT, lightInPoint*SSS)/(1.f + dist_to_light);
	/*if(dist_to_light - march_result.w > EPS_DIST){ // light not in wax
		float shadow_result;
		//normal = getNormal_InWax(march_result.xyz);
		//ray_origin = march_result.xyz - 4.*EPS_DIST*normal;
		//march_result = RayWaxShadow(ray_origin, ray_direction, dist_to_light - march_result.w - 4.*EPS_DIST, shadow_result);

		lightInPoint = max(SCATTERED_LIGHT/(1.f + dist_to_light), lightInPoint*shadow_result);
	}*/

	//lightInPoint = max(lightInPoint, SCATTERED_LIGHT);
	//if(SCATTERED_LIGHT > lightInPoint) return vec3(0., 0., 1.);
	return WAX_COLOR*lightInPoint;
}

vec3 getDecorColor(in vec3 point, in vec3 normal){
	float lightInPoint = 0.05;

	//inverted direction
	vec3 light_direction = normalize(u_scattLightPos - point);
	float cosTheta = dot(light_direction, normal);
	float len = length(LIGHT_POS - point);

	if(cosTheta > 0.f){
		float shadow;

		RayDecorShadow(point + 2.*EPS_DIST*light_direction, light_direction, len - 2.*EPS_DIST, shadow);
		lightInPoint += cosTheta*shadow*LIGHT_POWER/(0.5f + 0.4*len);
	}

	return WAX_COLOR*lightInPoint + VOID;
}

vec4 getWaxPoint(in vec3 ray_origin, in vec3 ray_direction, out vec3 normal){
	bool INFO_FLAG;
	//in glicerine
	vec4 march_result = RayWax(ray_origin, ray_direction, INFO_FLAG);
	normal = INFO_FLAG ? getNormal_Wax(march_result.xyz) : vec3(0.);
	return march_result;
}

vec4 getDecorPoint(in vec3 ray_origin, in vec3 ray_direction, out vec3 normal){
	bool INFO_FLAG;
	//in glicerine
	vec4 march_result = RayDecor(ray_origin, ray_direction, INFO_FLAG);
	normal = INFO_FLAG ? getNormal_Decorations(march_result.xyz) : vec3(0.);
	return march_result;
}

vec4 getPoint(in vec3 ray_origin, in vec3 ray_direction, out vec3 normal){
	bool INFO_FLAG;
	vec4 march_result;
	// calc all pixel
	// [camera -> out_flask -> in flask -> glicerine + wax -> in flask -> out_flask]
	// wax -> subsurface

	//out flask
	march_result = RayOutFlask(ray_origin, ray_direction, INFO_FLAG);
	if(INFO_FLAG)// not interect with world
	{
		normal = getNormal_Flask(march_result.xyz);
		ray_direction = refract(ray_direction, normal, AIR2GLASS_REFRACTIVE);
		ray_origin = march_result.xyz - 3.*EPS_DIST*normal; // set point in flask

		//in flask
		march_result = RayInFlask(ray_origin, ray_direction, INFO_FLAG);

		if(INFO_FLAG) // interect insides edge flask
		{
			normal = getNormal_InFlask(march_result.xyz);
			ray_direction = refract(ray_direction, normal, GLASS2GLICERINE_REFRACTIVE);
			ray_origin = march_result.xyz - 3.*EPS_DIST*normal; // set point in glicerine

			//in glicerine
			march_result = RayAll(ray_origin, ray_direction, INFO_FLAG);
			if(INFO_FLAG){ //intersect with wax
				normal = getNormal_Wax(march_result.xyz);
			}
			else
			{ //intersect with flask
				normal = getNormal_Flask(march_result.xyz);
				ray_direction = refract(ray_direction, normal, GLICERINE2GLASS_REFRACTIVE);
				ray_origin = march_result.xyz - 3.*EPS_DIST*normal; // set point in glicerine

				//in flask
				march_result = RayInFlask(ray_origin, ray_direction, INFO_FLAG);
				normal = getNormal_InFlask(march_result.xyz);

				ray_direction = refract(ray_direction, normal, GLASS2AIR_REFRACTIVE);
				ray_origin = march_result.xyz - 3.*EPS_DIST*normal;
				// out of flask
				march_result = RayDecor(ray_origin, ray_direction, INFO_FLAG);

				if(INFO_FLAG){
					normal = getNormal_Decorations(march_result.xyz);
				}
				else {
					normal = vec3(0.);
					march_result.w = INF;
				}
			}
		}
		else
		{
			//go out of flask
			normal = getNormal_InFlask(march_result.xyz);
			ray_direction = refract(ray_direction, normal, GLASS2AIR_REFRACTIVE);
			ray_origin = march_result.xyz - 3.*EPS_DIST*normal; // set point in flask

			march_result = RayDecor(ray_origin, ray_direction, INFO_FLAG);

			if(INFO_FLAG){
				normal = getNormal_Decorations(march_result.xyz);
			}
			else {
				normal = vec3(0.);
				march_result.w = INF;
			}
		}
	}
	else
	{
		//is decor or sky
		if(sdDecorations(march_result.xyz) > 0.01){
			normal = vec3(0.);
			march_result.w = INF;
		}
		else normal = getNormal_Decorations(march_result.xyz);
	}
	return march_result;
}

vec3 getAll(in vec3 ray_origin, in vec3 ray_direction){
	bool INFO_FLAG;
	vec4 march_result;
	vec3 normal;
	// calc all pixel
	// [camera -> out_flask -> in flask -> glicerine + wax -> in flask -> out_flask]
	// wax -> subsurface

	//out flask
	march_result = RayOutFlask(ray_origin, ray_direction, INFO_FLAG);
	if(INFO_FLAG)// not interect with world
	{
		normal = getNormal_Flask(march_result.xyz);
		ray_direction = refract(ray_direction, normal, AIR2GLASS_REFRACTIVE);
		ray_origin = march_result.xyz - 2.*EPS_DIST*normal; // set point in flask

		//in flask
		march_result = RayInFlask(ray_origin, ray_direction, INFO_FLAG);

		if(INFO_FLAG) // interect insides edge flask
		{
			normal = getNormal_InFlask(march_result.xyz);
			ray_direction = refract(ray_direction, normal, GLASS2GLICERINE_REFRACTIVE);
			ray_origin = march_result.xyz - 2.*EPS_DIST*normal; // set point in glicerine

			//in glicerine
			march_result = RayAll(ray_origin, ray_direction, INFO_FLAG);
			if(INFO_FLAG){ //intersect with wax
				normal = getNormal_Wax(march_result.xyz);
				return getWaxColor(march_result.xyz, normal);
			}
			else
			{ //intersect with flask
				normal = getNormal_Flask(march_result.xyz);
				ray_direction = refract(ray_direction, normal, GLICERINE2GLASS_REFRACTIVE);
				ray_origin = march_result.xyz - 2.*EPS_DIST*normal; // set point in glicerine

				//in flask
				march_result = RayInFlask(ray_origin, ray_direction, INFO_FLAG);
				normal = getNormal_InFlask(march_result.xyz);

				ray_direction = refract(ray_direction, normal, GLASS2AIR_REFRACTIVE);
				ray_origin = march_result.xyz - 2.*EPS_DIST*normal;
				// out of flask
				march_result = RayDecor(ray_origin, ray_direction, INFO_FLAG);

				if(INFO_FLAG){
					normal = getNormal_Decorations(march_result.xyz);
					return getDecorColor(march_result.xyz, normal);
				}
			}
		}
		else
		{
			//go out of flask
			normal = getNormal_InFlask(march_result.xyz);
			ray_direction = refract(ray_direction, normal, GLASS2AIR_REFRACTIVE);
			ray_origin = march_result.xyz - 2.*EPS_DIST*normal; // set point in flask

			march_result = RayDecor(ray_origin, ray_direction, INFO_FLAG);

			if(INFO_FLAG){
				normal = getNormal_Decorations(march_result.xyz);
				return getDecorColor(march_result.xyz, normal);
			}
		}
	}
	else
	{
		//is decor or sky
		if(sdDecorations(march_result.xyz) < 0.01){
			normal = getNormal_Decorations(march_result.xyz);
			return getDecorColor(march_result.xyz, normal);
		}
	}
	return VOID+vec3(10.f)/(100.f+march_result.y);
}

//MAIN
void main(){
    //ray from pixel, camera
    vec3 ray_origin = u_cameraPosition;
	vec3 ray_direction = normalize(v_ray_direction);

	vec3 col;
	vec3 normal;
	vec4 point;
	//debuging
	switch(u_debugMode){
		//debug for bubles
		case 1u:
			point = getPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = vec3(2.5/sqrt(point.w));
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		case 2u:
			point = getPoint(ray_origin, ray_direction, normal);
			if(point.w < INF) col = fract(point.xyz);
			break;
		case 3u:
			point = getPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = (normal+1.)*0.5;
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		case 4u:
			point = getWaxPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = vec3(2.5/sqrt(point.w));
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		case 5u:
			point = getWaxPoint(ray_origin, ray_direction, normal);
			if(point.w < INF) col = fract(point.xyz);
			break;
		case 6u:
			point = getWaxPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = (normal+1.)*0.5;
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		case 7u:
			point = getDecorPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = vec3(2.5/sqrt(point.w));
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		case 8u:
			point = getDecorPoint(ray_origin, ray_direction, normal);
			if(point.w < INF) col = fract(point.xyz);
			break;
		case 9u:
			point = getDecorPoint(ray_origin, ray_direction, normal);
			if(point.w < INF){
				col = (normal+1.)*0.5;
				col -= smoothstep(0.97,1.,max(fract(point.x),max(fract(point.y),fract(point.z))));
			}
			break;
		// non debug
		default:
			col = getAll(ray_origin, ray_direction);
	}
	out_fragColor = vec4(col, 1.);
}
