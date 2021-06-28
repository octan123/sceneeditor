#include"TrajectoryBuilder.h"
#include"Clothoid.h"
#include <iostream>
inline Vec2::Vec2(double xx, double yy)
: x(xx), y(yy)
{
}
inline Vec2::Vec2()
: x(0.0f), y(0.0f)
{
}
inline Vec2::Vec2(const Vec2& v)
{
    x = v.x;
    y = v.y;
}

inline Vec2 Vec2::operator+(const Vec2& v) const
{
    Vec2 result(*this);
    result.x = result.x + v.x;
    result.y = result.y + v.y;
    return result;
}

inline Vec2 Vec2::operator*(double s) const
{
    Vec2 result(*this);
    result.x *= s;
    result.y *= s;
    return result;
}

double Vec2::distance(const Vec2& v) const
{
    double dx = v.x - x;
    double dy = v.y - y;

    return std::sqrt(dx * dx + dy * dy);
}

inline Vec2 Vec2::operator/(const double s) const
{
    return Vec2(this->x / s, this->y / s);
}

inline Vec2 operator*(double x, const Vec2& v)
{
    Vec2 result(v);
    result.x*=x;
    result.y*=x;
    return result;
}

TrajectoryBuilder::TrajectoryBuilder()
{
}

TrajectoryBuilder::~TrajectoryBuilder()
{
}
std::vector<std::vector<Vec2>> TrajectoryBuilder::getAllTrajectoryPoints(std::vector<TrajectoryPoint> trajectoryPoints)
{
    std::vector<std::vector<Vec2>> retPoints;

    if(trajectoryPoints.size()<=1)
    {
        return retPoints;
    }
    // retPoints = getCubicBezierPoints(trajectoryPoints);
    // retPoints = getClothoidPoints(trajectoryPoints);
    switch (_type)
    {
    case TrajectoryType::CLOTHOID:
        retPoints = getClothoidPoints(trajectoryPoints);
        break;
    case TrajectoryType::BEZIER:
        retPoints = getCubicBezierPoints(trajectoryPoints);
        break;

    default:
        break;
    }
    return retPoints;
}

std::vector<std::vector<Vec2>> TrajectoryBuilder::getClothoidPoints(std::vector<TrajectoryPoint> trajectoryPoints)
{
    std::vector<std::vector<Vec2> > retPoints;

    for (int i = 0; i < trajectoryPoints.size() - 1; i++)
    {
        TrajectoryPoint p1 = trajectoryPoints[i];
        TrajectoryPoint p2 = trajectoryPoints[i + 1];
        double K, DK, L;
        p1.heading = p1.heading /180*M_PI;
        p2.heading = p2.heading /180*M_PI;
        Clothoid::buildClothoid(p1.pos.x, p1.pos.y, p1.heading,
                                p2.pos.x, p2.pos.y, p2.heading,
                                K, DK, L);
        std::vector<Vec2> points;

        float margin_of_two_points = 1.0;
        uint npts = L / margin_of_two_points;
        Clothoid::pointsOnClothoid(p1.pos.x, p1.pos.y, p1.heading, K, DK, L, npts, points);
        retPoints.push_back(points);
    }
    return retPoints;


    // std::vector<std::vector<Vec2>> retPoints;
    // Clothoid cld;
    // for (int i = 0; i < trajectoryPoints.size()-1; i++)
    // {
    //     TrajectoryPoint a = trajectoryPoints[i];
    //     TrajectoryPoint b = trajectoryPoints[i+1];

    //     if (std::fabs(a.heading -  b.heading)>180)
    //     {
    //         a.heading < b.heading ? (a.heading+=360) : (b.heading+=360);
    //     }
    //     if (a.heading >=180 && b.heading>= 180)
    //     {
    //         a.heading -= 360;
    //         b.heading -= 360;
    //     }
    //     a.heading = (double)a.heading/180*M_PI;
    //     b.heading = (double)b.heading/180*M_PI;
    //     std::vector<Vec2> points;
    //     int reserve = 1;
    //     cld.getPath(a, b, points, reserve);
    //     if (points.size()>0)
    //     {
    //         retPoints.push_back(points);
    //     }else{
    //         retPoints.push_back({a.pos, b.pos});
    //     }
        
    // }
    // return retPoints;    
}


// std::vector<std::vector<Vec2>> TrajectoryBuilder::getClothoidPoints(std::vector<TrajectoryPoint> trajectoryPoints)
// {   
//     auto factorial = [](int num)->int
//     {
//         int ret = 1;
//         while (num>0)
//         {
//             ret *= num;
//             num--;
//         }
//         return ret;
        
//     };
//     auto clothoidcooridnate = [&](double A, double distance)->Vec2
//     {
//         Vec2 pos(0, 0);
//         for(unsigned int n = 0; n<30; n++)
//         {
//             pos.x += (std::pow(-1, n) * std::pow(A, 2 * n) * std::pow(distance, 4 * n + 1) / \
//                 (factorial(2 * n) * (4 * n + 1) * std::pow(2, 2 * n)));
//             pos.y += (std::pow(-1, n) * std::pow(A, 2 * n + 1) * std::pow(distance, 4 * n + 3) / \
//                 (factorial(2 * n + 1) * (4 * n + 3) * std::pow(2, 2 * n + 1)));
//         }
//         return pos;
//     };
    
//     auto transfercoordinate = [](double heading)->std::vector<std::vector<double>>
//     {
//         std::vector<std::vector<double>> ret;
//         ret.push_back({std::cos(heading), -std::sin(heading)});
//         ret.push_back({std::sin(heading), std::cos(heading)});
//         return ret;
//     };
    

//     auto clothoid = [&](double curveStart, double curveEnd, double curveLength, double distance)->Vec2 //curveLength为截取曲线的长度，distance为相对于截取段起始点s0处的距离，给定一个distance就返回该distance处的XY坐标
//     {
//         double A = (curveEnd - curveStart) / curveLength;
//         double s0 = curveStart / A;
//         Vec2 pos0= clothoidcooridnate(A, s0);
//         double heading0 = std::pow(A / 2 * s0 ,2);
//         auto inv = [](std::vector<std::vector<double>> mat2)->std::vector<std::vector<double>>
//         {
//             double tmp=mat2[0][0]*mat2[1][1]-mat2[1][0]*mat2[0][1];
//             std::vector<std::vector<double>> invMat = {
//                 {mat2[1][1]/tmp + 0, -(mat2[0][1])/tmp + 0},
//                 {-(mat2[1][0])/tmp + 0, mat2[0][0]/tmp + 0}
//                 };
//             return invMat;
//         };
//         std::vector<std::vector<double>> transferMatrix = inv(transfercoordinate(heading0));
//         Vec2 pos1= clothoidcooridnate(A, distance + s0);
//         Vec2 pos = pos1 - pos0;
//         Vec2 local;
//         local.x = transferMatrix[0][0] * pos.x + transferMatrix[0][1] * pos.y;
//         local.y = transferMatrix[1][0] * pos.x + transferMatrix[1][1] * pos.y;
//         //X, Y = clothoidcooridnate(A, distance + s0)
//         // local = np.dot(transferMatrix, np.array([[X], [Y]]) - np.array([[X0], [Y0]]))
//         // x = local[0, 0]
//         // y = local[1, 0]
//         // double heading = A / 2 * distance ** 2 + curveStart * distance
//         return local;
//     };
    

//     std::vector<std::vector<Vec2>> retPoints;

//     double curStart = 0.4; //曲线起点曲率 
//     double curEnd = 0.5; //曲线终点曲率 
//     int n = 30; //设置迭代步长
//     double l2 = 4*n+1;
//     double l3 = std::pow(10, 300/(4*n+1));
//     double min = l2<l3 ? l2:l3;
//     double tmp = 2* std::pow(factorial(2*n), 1 / (2*n))/std::abs(curStart + 1e-5);
//     double lk0 = tmp<min ? tmp:min;
//     tmp = 2*std::pow(factorial(2*n), 1 / (2*n))/std::abs(curEnd + 1e-5);
//     double lkt = tmp<min ? tmp:min;
//     //允许设置的曲线长度'
//     double allowsCurveLength = curEnd*curStart<=0 ? std::abs(lk0+lkt) : std::abs(lkt-lk0);
//     double curveLength = 15;
//     double offset = curveLength*0.001;
//     double distance = 0;
//     std::vector<Vec2> points;
//     for(int i = 0; i<1000; i++){
//         distance = i*offset;
//         Vec2 point = clothoid(curStart, curEnd, curveLength, distance);
//         points.push_back(point);
//     }
//     retPoints.push_back(points);
//     return retPoints;
// }

std::vector<std::vector<Vec2>> TrajectoryBuilder::getBezierPoints(std::vector<TrajectoryPoint> trajectoryPoints)
{
    std::vector<std::vector<Vec2>> spans;
    for (int i = 0; i < trajectoryPoints.size()-1; i++)
    {
        Vec2 p0 = trajectoryPoints[i].pos;
        double h0 = trajectoryPoints[i].heading;
        Vec2 p2 = trajectoryPoints[i+1].pos;
        double h2 = trajectoryPoints[i+1].heading;
        double k0 = std::tan(h0*M_PI/180);
        double k2 = std::tan(h2*M_PI/180);
        double b0 = p0.y - k0*p0.x;
        double b2 = p2.y - k2*p2.x;
        Vec2 p1;
        if(IS_DOUBLE_ZERO(k2-k0)){
            p1 = (p0 + p2)/2;
        }
        else{
            if(IS_DOUBLE_ZERO(fmod((h0+180), 180) -90))
            {
                p1.x = p0.x;
                p1.y = k2*p1.x+b2;
            }
            else if(IS_DOUBLE_ZERO(fmod((h2+180), 180.0) -90))
            {
                p1.x = p2.x;
                p1.y = k0*p1.x+b0;
            }
            else{
                p1.x = (b2-b0)/(k0-k2);
                p1.y = k0*p1.x + b0;
            }
        }
        spans.push_back({p0, p1, p2});
    }

    std::vector<std::vector<Vec2>> retPoints;
    for (int i = 0; i < spans.size(); i++)
    {
        std::vector<Vec2> bezierPoints = spans[i];
        
        Vec2 p0 = bezierPoints[0];
        Vec2 p1 = bezierPoints[1];
        Vec2 p2 = bezierPoints[2];
        int segments = (int)(p0.distance(p1) + p1.distance(p2));
        bezierPoints.clear();
        for (int j = 0; j <= segments; j++)
        {//B(t) = (1-t)^2*p0 + 2t(1-t)p1 +t^2p2;
            double t = (double)j/segments;
            Vec2 point = std::pow(1-t, 2)*p0 + 2*t*(1-t)*p1 + t*t*p2;
            bezierPoints.push_back(point);
        }
        retPoints.push_back(bezierPoints);
    }
    return retPoints;
}


std::vector<std::vector<Vec2>> TrajectoryBuilder::getCubicBezierPoints(std::vector<TrajectoryPoint> trajectoryPoints)
{
    std::vector<std::vector<Vec2>> spans;
    for (int i = 0; i < trajectoryPoints.size()-1; i++)
    {
        Vec2 p0 = trajectoryPoints[i].pos;
        Vec2 p3 = trajectoryPoints[i+1].pos;
        double distance = p0.distance(p3)*0.25;

        double angle = trajectoryPoints[i].heading;
        Vec2 dir0(std::cos(angle*M_PI/180), std::sin(angle*M_PI/180));
        Vec2 p1(p0.x + dir0.x *distance, p0.y + dir0.y*distance);

        angle = trajectoryPoints[i+1].heading;
        Vec2 dir3(std::cos(angle*M_PI/180), std::sin(angle*M_PI/180));

        Vec2 p2(p3.x - dir3.x *distance, p3.y - dir3.y*distance);
        spans.push_back({p0, p1, p2, p3});
    }

    std::vector<std::vector<Vec2>> retPoints;
    for (int i = 0; i < spans.size(); i++)
    {
        std::vector<Vec2> bezierPoints = spans[i];
        Vec2 p0 = bezierPoints[0];
        Vec2 p1 = bezierPoints[1];
        Vec2 p2 = bezierPoints[2];
        Vec2 p3 = bezierPoints[3];
        bezierPoints.clear();
        int segments = (int)(p0.distance(p1) + p1.distance(p2) +  p2.distance(p3));
        for (int j = 0; j < segments; j++)
        {
            double t = (double)j/segments;
            Vec2 p0t(p0 * std::pow(1-t, 3));
            Vec2 p1t(p1 * 3*t*std::pow(1-t, 2));
            Vec2 p2t(p2 * 3*t*t*(1-t));
            Vec2 p3t(p3 * std::pow(t,3));
            Vec2 point(p0t + p1t + p2t + p3t);
            bezierPoints.push_back(point);
        }
        retPoints.push_back(bezierPoints);
    }
    return retPoints;
}
 // std::vector<std::vector<Vec2>> TrajectoryBuilder::getBezierPoints(std::vector<TrajectoryPoint> trajectoryPoints)
// {
//     std::vector<std::vector<Vec2>> spans;
//     for (int i = 0; i < trajectoryPoints.size()-1; i++)
//     {
//         Vec2 p0 = trajectoryPoints[i].pos;
//         Vec2 p3 = trajectoryPoints[i+1].pos;
//         double distance = p0.distance(p3);
//         auto getAngle = [](double angle, int tag)->double
//         {
//             double angleTmp = angle + tag * M_PI * 0.5;
//             double z = std::sin(angleTmp/2);
//             double w = std::cos(angleTmp/2);
//             angle = std::atan2(z,w) * 2;
//             angle *= -1;
//             return angle;
//         };
//         double angle = trajectoryPoints[i].heading;
//         angle = getAngle(angle, -1);

//         Vec2 dir1(std::cos(angle), std::sin(angle));
//         Vec2 p1(p0.x + dir1.x *distance, p0.y + dir1.y*distance);

//         angle = trajectoryPoints[i+1].heading;
//         angle = getAngle(angle, 1);

//         Vec2 dir2(std::cos(angle), std::sin(angle));
//         Vec2 p2(p3.x + dir2.x *distance, p3.y + dir2.y*distance);
//         spans.push_back({p0, p1, p2, p3});
//     }

//     std::vector<std::vector<Vec2>> retPoints;
//     for (int i = 0; i < spans.size(); i++)
//     {
//         std::vector<Vec2> bezierPoints = spans[i];
//         int segments = 10;
//         Vec2 p0 = bezierPoints[0];
//         Vec2 p1 = bezierPoints[1];
//         Vec2 p2 = bezierPoints[2];
//         Vec2 p3 = bezierPoints[3];
//         bezierPoints.clear();
//         for (int j = 0; j < segments; j++)
//         {
//             double t = j/segments;
//             Vec2 p0t(p0 * std::pow(1-t, 3));
//             Vec2 p1t(p1 * 3*t*std::pow(1-t, 2));
//             Vec2 p2t(p2 * 3*t*t*(1-t));
//             Vec2 p3t(p3 * std::pow(t,3));
//             Vec2 point(p0t + p1t + p2t + p3t);
//             bezierPoints.push_back(point);
//         }

//         retPoints.push_back(bezierPoints);
//     }
//     return retPoints;
    
    

// }


/*

double Clothoid::inRange(double theta) {
    if (theta > M_PI) {
        while (theta > M_PI) {
            theta -= 2 * M_PI;
        }
    }
    if (theta <= M_PI) {
        while (theta <= -M_PI) {
            theta += 2 * M_PI;
        }
    }
    return theta;
}

Clothoid::Clothoid() {
    kMax = 1000;
    solution = 1;
}

int Clothoid::signum(double a) {
    if (a < 0)
        return -1;
    else if (a > 0)
        return 1;
    else
        return 0;
}

double Clothoid::calcD(double alpha) {
    double x, z;
    fresnel(std::sqrt(2 * alpha / M_PI), x, z);
    double d = std::cos(alpha) * (x)+ (std::sin(alpha) * z);
    return d;
}

void Clothoid::getPath(TrajectoryPoint a, TrajectoryPoint b, std::vector<Vec2>&resultPoints,  int reserve)
{
    if (fabs(a.pos.x - b.pos.x) < 1 || fabs(a.pos.y - b.pos.y) < 1) {
        if (reserve == 1)
        {
            resultPoints.push_back(a.pos);
            resultPoints.push_back(b.pos);
        }else{
            resultPoints.push_back(b.pos);
            resultPoints.push_back(a.pos);
        }
        solution = 0;
        return;
    }
    double beta = std::atan2((b.pos.y - a.pos.y), (b.pos.x - a.pos.x));

    // if (std::fabs(beta - b.heading - a.heading + beta) < 0.001 && std::fabs(b.heading - a.heading) < M_PI) {
    if (std::fabs(beta - b.heading - a.heading + beta) < 0.001 && std::fabs(b.heading - a.heading) < M_PI) {
        start = a;
        end = b;
        double alpha = inRange((-start.heading + end.heading)) / 2;

        double D = calcD(std::fabs(alpha));
        path.sigma = 4 * M_PI * signum(alpha) * D * D / start.pos.distance(end.pos)/start.pos.distance(end.pos);
        if (path.sigma == 0) {
        // if (path.sigma <= 0.1) {
            path.lengthOfPath = start.pos.distance(end.pos);
            for (double s = 0; s < path.lengthOfPath; s += path.lengthOfPath / 100) {
                TrajectoryPoint pt;
                pt.pos.x = start.pos.x + s * std::cos(start.heading);
                pt.pos.y = start.pos.y + s * std::sin(start.heading);
                pt.heading = 0;
                path.path.push_back(pt);
            }
            if (reserve == 1)
            {
                for(auto item : path.path){
                    resultPoints.push_back(item.pos);
                }
            }else
            {
                for(int i = path.path.size()-1; i>=0; i--){
                    resultPoints.push_back(path.path[i].pos);
                }
            }
            
            
            // paths.push_back(ClothoidPathSegment(path.path, path.lengthOfPath, path.sigma));
            return;
        } else {
            path.lengthOfPath = 2 * sqrt(std::fabs(2 * alpha / path.sigma));
            getTrajectory();
            if (reserve == 1)
            {
                for(auto item : path.path){
                    resultPoints.push_back(item.pos);
                }
            }else
            {
                for(int i = path.path.size()-1; i>=0; i--){
                    resultPoints.push_back(path.path[i].pos);
                }
            }
            // paths.push_back(ClothoidPathSegment(path.path, path.lengthOfPath, path.sigma));
        }
    }
    else if (a.heading == b.heading) {
        TrajectoryPoint p;
        p.pos = Vec2((a.pos.x + b.pos.x) / 2, (a.pos.y + b.pos.y) / 2);
        p.heading = 0;
        double beta = std::atan2((p.pos.y - a.pos.y), (p.pos.x - a.pos.x));
        p.heading = 2 * beta - a.heading;
        getPath(a, p, resultPoints, reserve);
        getPath(p, b, resultPoints, reserve);

    } else {
        double alpha = inRange(((-a.heading + b.heading)) / 2);
        double cc;
        cc = std::cos(alpha) / std::sin(alpha);
        TrajectoryPoint p;
        p.pos.x = (a.pos.x + b.pos.x + cc * (a.pos.y - b.pos.y)) / 2;
        p.pos.y = (a.pos.y + b.pos.y + cc * (b.pos.x - a.pos.x)) / 2;
        double r = p.pos.distance(a.pos);
        double deflection1 = (std::atan2((p.pos.y - a.pos.y), (p.pos.x - a.pos.x)));
        double deflection2 = (std::atan2((p.pos.y - b.pos.y), (p.pos.x - b.pos.x)));
        double def;
        TrajectoryPoint c;
        bool bswap = false;
        if (deflection2 > deflection1) {
            //swap
            bswap = true;
            double temp = deflection2;
            deflection2 = deflection1;
            deflection1 = temp;
            c.pos.x = a.pos.x;
            c.pos.y = a.pos.y;
            c.heading = a.heading;
            a.pos.x = b.pos.x;
            a.pos.y = b.pos.y;
            a.heading = b.heading;
            b.pos.x = c.pos.x;
            b.pos.y = c.pos.y;
            b.heading = c.heading;
        }
        def = ((deflection2 + deflection1)) / 2;
        alpha = (((-a.heading + b.heading)) / 2);
        if (alpha < 0) {

            def = inRange(M_PI + def);
        }
        TrajectoryPoint q;
        q.heading = 0;


        q.pos.x = p.pos.x + r * std::cos(def);
        q.pos.y = p.pos.y + r * std::sin(def);



        double the = std::atan2((a.pos.y - q.pos.y), (a.pos.x - q.pos.x));
        double the2 = std::atan2((q.pos.y - b.pos.y), (q.pos.x - b.pos.x));

        double beta1 = inRange(2 * the - a.heading);
        double beta2 = inRange(2 * the2 - b.heading);
        q.heading = beta1;
        if (bswap)
        {
            reserve *= -1;
        }
        if (reserve == 1)
        {
            getPath(a, q, resultPoints, reserve);
            getPath(q, b, resultPoints, reserve);
        }else{
            getPath(q, b, resultPoints, reserve);
            getPath(a, q, resultPoints, reserve);
        }

        
    }
}

void Clothoid::getXY(double s, double a, double b, double c, double& x, double& y) {
    double storeX, storeY;

    if (a > 0) {
        double limit_ = (b + 2 * a * s) / (std::sqrt(2 * std::fabs(a) * M_PI));
        fresnel(limit_, storeX, storeY);

        x = std::sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a - c))*(storeX)+(std::sin(b * b / 4 / a - c))*(storeY));
        y = std::sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a - c))*(storeY)-(std::sin(b * b / 4 / a - c))*(storeX));

        double x1, y1;
        limit_ = (b) / (std::sqrt(2 * std::fabs(a) * M_PI));
        fresnel(limit_, storeX, storeY);
        x1 = sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a - c))*(storeX)+(std::sin(b * b / 4 / a - c))*(storeY));
        y1 = sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a - c))*(storeY)-(std::sin(b * b / 4 / a - c))*(storeX));

        x -= x1;
        y -= y1;

    } else {

        a = -a;
        double limit_ = (2 * a * s - b) / (std::sqrt(2 * std::fabs(a) * M_PI));
        fresnel(limit_, storeX, storeY);


        x = std::sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a + c))*(storeX)+(std::sin(b * b / 4 / a + c))*(storeY));
        y = std::sqrt(M_PI / 2 / std::fabs(a))*(-(std::cos(b * b / 4 / a + c))*(storeY)+(std::sin(b * b / 4 / a + c))*(storeX));

        double x1, y1;

        limit_ = (-b) / (std::sqrt(2 * a * M_PI));

        fresnel(limit_, storeX, storeY);

        x1 = std::sqrt(M_PI / 2 / std::fabs(a))*((std::cos(b * b / 4 / a + c))*(storeX)+(std::sin(b * b / 4 / a + c))*(storeY));
        y1 = std::sqrt(M_PI / 2 / std::fabs(a))*(-(std::cos(b * b / 4 / a + c))*(storeY)+(std::sin(b * b / 4 / a + c))*(storeX));
        x -= x1;
        y -= y1;
    }


}

void Clothoid::getTrajectory() {

    double s = 0, tempS;
    double x, y;
    path.path.clear();
    double x0, y_zero;
    double k0 = 0, theta0 = start.heading;
    getXY(path.lengthOfPath / 2, path.sigma / 2, k0, theta0, x0, y_zero);
    double k1 = path.sigma * path.lengthOfPath / 2 + k0;
    double theta1 = path.sigma / 2 * path.lengthOfPath * path.lengthOfPath / 4 + k0 * path.lengthOfPath / 2 + theta0;
    for (s = 0; s < path.lengthOfPath; s += path.lengthOfPath / 100) {

        tempS = s;

        if (s <= path.lengthOfPath / 2) {
            if (path.sigma * s < kMax) {
                double a = path.sigma / 2, b = k0, c = theta0;
                getXY(s, a, b, c, x, y);
            } else {
                x = std::sin(kMax * s + theta0) / kMax - std::sin(theta0) / kMax;
                y = std::cos(theta0) / kMax - std::cos(kMax * s + theta0) / kMax;

            }
            TrajectoryPoint pt;
            pt.pos.x = start.pos.x + x;
            pt.pos.y = start.pos.y + y;
            pt.heading = 0;
            path.path.push_back(pt);

        } else {
            s = tempS;
            tempS = s - path.lengthOfPath / 2;

            if (path.sigma * s < kMax) {


                double a = -path.sigma / 2, c = theta1;
                double b = path.sigma * path.lengthOfPath / 2 + k0;
                double X1, Y1;

                getXY(tempS, a, b, c, X1, Y1);
                //   std::cout<<"X "<<X1<<" Y "<<Y1;

                getXY(0, a, b, c, x, y);
                X1 -= x;
                Y1 -= y;
                x = x0 + X1;
                y = y_zero + Y1;

                //  std::cout<<"Hello 3 theta "<<theta1+a*tempS*tempS+b*tempS<<" s "<<s<<" k "<<sigma*(larc/2-tempS)<<" x "<<x<<" y "<<y<<std::endl;

            } else {

                x = std::sin(kMax * s + theta0) / kMax - std::sin(theta0) / kMax;
                y = std::cos(theta0) / kMax - std::cos(kMax * s + theta0) / kMax;

            }
            TrajectoryPoint pt;
            pt.pos.x = start.pos.x + x;
            pt.pos.y = start.pos.y + y;
            pt.heading = 0;
            path.path.push_back(pt);
        }
    }
}
std::vector<Vec2> Clothoid::getPathPoints()
{
    std::vector<Vec2> ret;
    for(auto item: path.path)
    {
        ret.push_back(item.pos);
    }
    return ret;
}

int Clothoid::fresnel(double x, double &costerm, double &sinterm) {
    double xxa;
    double f;
    double g;
    double cc;
    double ss;
    double t;
    double u;
    double x2;
    double sn;
    double sd;
    double cn;
    double cd;
    double fn;
    double fd;
    double gn;
    double gd;
    double mpi;
    double mpio2;


    mpi = 3.14159265358979323846;
    mpio2 = 1.57079632679489661923;
    xxa = x;
    x = fabs(xxa);
    x2 = x*x;
    if (x2 < 2.5625) {
        t = x2*x2;
        sn = -2.99181919401019853726E3;
        sn = sn * t + 7.08840045257738576863E5;
        sn = sn * t - 6.29741486205862506537E7;
        sn = sn * t + 2.54890880573376359104E9;
        sn = sn * t - 4.42979518059697779103E10;
        sn = sn * t + 3.18016297876567817986E11;
        sd = 1.00000000000000000000E0;
        sd = sd * t + 2.81376268889994315696E2;
        sd = sd * t + 4.55847810806532581675E4;
        sd = sd * t + 5.17343888770096400730E6;
        sd = sd * t + 4.19320245898111231129E8;
        sd = sd * t + 2.24411795645340920940E10;
        sd = sd * t + 6.07366389490084639049E11;
        cn = -4.98843114573573548651E-8;
        cn = cn * t + 9.50428062829859605134E-6;
        cn = cn * t - 6.45191435683965050962E-4;
        cn = cn * t + 1.88843319396703850064E-2;
        cn = cn * t - 2.05525900955013891793E-1;
        cn = cn * t + 9.99999999999999998822E-1;
        cd = 3.99982968972495980367E-12;
        cd = cd * t + 9.15439215774657478799E-10;
        cd = cd * t + 1.25001862479598821474E-7;
        cd = cd * t + 1.22262789024179030997E-5;
        cd = cd * t + 8.68029542941784300606E-4;
        cd = cd * t + 4.12142090722199792936E-2;
        cd = cd * t + 1.00000000000000000118E0;

        sinterm = signum(xxa) * x * x2 * sn / sd;
        costerm = signum(xxa) * x * cn / cd;
        return 0;
    }
    if (x > 36974.0) {
        costerm = signum(xxa)*0.5;
        sinterm = signum(xxa)*0.5;
        return 0;
    }
    x2 = x*x;
    t = mpi*x2;
    u = 1 / (t * t);
    t = 1 / t;
    fn = 4.21543555043677546506E-1;
    fn = fn * u + 1.43407919780758885261E-1;
    fn = fn * u + 1.15220955073585758835E-2;
    fn = fn * u + 3.45017939782574027900E-4;
    fn = fn * u + 4.63613749287867322088E-6;
    fn = fn * u + 3.05568983790257605827E-8;
    fn = fn * u + 1.02304514164907233465E-10;
    fn = fn * u + 1.72010743268161828879E-13;
    fn = fn * u + 1.34283276233062758925E-16;
    fn = fn * u + 3.76329711269987889006E-20;
    fd = 1.00000000000000000000E0;
    fd = fd * u + 7.51586398353378947175E-1;
    fd = fd * u + 1.16888925859191382142E-1;
    fd = fd * u + 6.44051526508858611005E-3;
    fd = fd * u + 1.55934409164153020873E-4;
    fd = fd * u + 1.84627567348930545870E-6;
    fd = fd * u + 1.12699224763999035261E-8;
    fd = fd * u + 3.60140029589371370404E-11;
    fd = fd * u + 5.88754533621578410010E-14;
    fd = fd * u + 4.52001434074129701496E-17;
    fd = fd * u + 1.25443237090011264384E-20;
    gn = 5.04442073643383265887E-1;
    gn = gn * u + 1.97102833525523411709E-1;
    gn = gn * u + 1.87648584092575249293E-2;
    gn = gn * u + 6.84079380915393090172E-4;
    gn = gn * u + 1.15138826111884280931E-5;
    gn = gn * u + 9.82852443688422223854E-8;
    gn = gn * u + 4.45344415861750144738E-10;
    gn = gn * u + 1.08268041139020870318E-12;
    gn = gn * u + 1.37555460633261799868E-15;
    gn = gn * u + 8.36354435630677421531E-19;
    gn = gn * u + 1.86958710162783235106E-22;
    gd = 1.00000000000000000000E0;
    gd = gd * u + 1.47495759925128324529E0;
    gd = gd * u + 3.37748989120019970451E-1;
    gd = gd * u + 2.53603741420338795122E-2;
    gd = gd * u + 8.14679107184306179049E-4;
    gd = gd * u + 1.27545075667729118702E-5;
    gd = gd * u + 1.04314589657571990585E-7;
    gd = gd * u + 4.60680728146520428211E-10;
    gd = gd * u + 1.10273215066240270757E-12;
    gd = gd * u + 1.38796531259578871258E-15;
    gd = gd * u + 8.39158816283118707363E-19;
    gd = gd * u + 1.86958710162783236342E-22;
    f = 1 - u * fn / fd;
    g = t * gn / gd;
    t = mpio2*x2;
    cc = cos(t);
    ss = sin(t);
    t = mpi*x;
    costerm = 0.5 + (f * ss - g * cc) / t;
    sinterm = 0.5 - (f * cc + g * ss) / t;
    costerm = costerm * signum(xxa);
    sinterm = sinterm * signum(xxa);
    return 0;
}
*/