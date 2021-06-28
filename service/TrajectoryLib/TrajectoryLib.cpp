/*
 * esmini - Environment Simulator Minimalistic
 * https://github.com/esmini/esmini
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) partners of Simulation Scenarios
 * https://sites.google.com/view/simulationscenarios
 */

#include "TrajectoryLib.hpp"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include <string>
#include <fstream>
#include "TrajectoryBuilder.h"
#include <iostream>

// static char *retPtr = NULL;
static std::string retData;
using namespace std;
extern "C"
{
	RM_DLL_API const char* getAllTrajectoryPoints(int type, routePoint pts[], int size)
	{
		cout<<"getAllTrajectoryPoints begin"<<endl;
		cout<<"type:"<<type<<" size:"<<size<<endl;
		for (int i = 0; i < size; i++)
		{
			cout<<"point"<<i<<" x:"<<pts[i].x<<" y:"<<pts[i].y<<" heading:"<<pts[i].heading<<endl;
		}
		
		TrajectoryBuilder builder;

		builder.setType((TrajectoryType)type);
		std::vector<TrajectoryPoint> trajectoryPts;
		for(int i =0; i<size; i++)
		{
			TrajectoryPoint pt;
			pt.pos.x = pts[i].x;
			pt.pos.y = pts[i].y;
			pt.heading = pts[i].heading;
			trajectoryPts.push_back(pt);
		}

		std::vector<std::vector<Vec2>> points = builder.getAllTrajectoryPoints(trajectoryPts);

		rapidjson::StringBuffer strBuf;

		rapidjson::Writer<rapidjson::StringBuffer> writer(strBuf);

		writer.StartObject();

		writer.Key("points");

     	writer.StartArray();
		
		for(auto pts : points)
		{
     		writer.StartArray();
			for(auto pt: pts)
			{
				writer.StartObject();
				writer.Key("x");
				writer.Double(pt.x);
				writer.Key("y");
				writer.Double(pt.y);
				writer.Key("z");
				writer.Double(0);
				writer.EndObject(); 
			}
			writer.EndArray();
		}

		writer.EndArray();
		writer.EndObject();
		// std::string retData = strBuf.GetString();
		retData = strBuf.GetString();
		// char* rst = const_cast<char *>(retData.c_str());

		// if(retPtr!=NULL){
		// 	free(retPtr);
		// 	retPtr = NULL;
		// }
		cout<<"ret data size = "<<retData.size()<<endl;

		// retPtr = (char *)malloc(sizeof(char)*retData.size());
		// strcpy(retPtr, retData.c_str());
		cout<<"getAllTrajectoryPoints end"<<endl;
		return retData.c_str();
	}
	RM_DLL_API void clean()
	{
		cout<<"clean begin"<<endl;

		// if(retPtr!=NULL){
		// 	cout<<"tag 18"<<endl;

		// 	free(retPtr);
		// 	retPtr = NULL;
		// }
		cout<<"clean end"<<endl;

	}
}
